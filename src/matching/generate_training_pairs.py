import sys
import os
import time
import random
import polars as pl
import numpy as np
import matplotlib.pyplot as plt

# Ensure UTF-8 output
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
random.seed(42)
np.random.seed(42)

print("=" * 70)
print("PHASE 4: CONSTRUCTING THE TRAINING DATASET")
print("Contrastive Learning, Data Augmentation & Hard Negative Mining")
print("=" * 70)

t_start = time.time()
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
input_serialized = os.path.join(PROJECT_ROOT, "data", "interim", "serialized_companies.parquet")
input_preprocessed = os.path.join(PROJECT_ROOT, "data", "interim", "preprocessed_companies.parquet")
input_candidates = os.path.join(PROJECT_ROOT, "data", "processed", "candidate_pairs_top10.parquet")
output_pairs_parquet = os.path.join(PROJECT_ROOT, "data", "processed", "training_pairs.parquet")
output_pairs_sample = os.path.join(PROJECT_ROOT, "data", "processed", "training_pairs_sample.csv")
output_triplets_parquet = os.path.join(PROJECT_ROOT, "data", "processed", "training_triplets.parquet")
output_train_parquet = os.path.join(PROJECT_ROOT, "data", "processed", "train_pairs.parquet")
output_val_parquet = os.path.join(PROJECT_ROOT, "data", "processed", "val_pairs.parquet")

# Step 1: Load Serialized Companies and Candidate Pairs
print("[1/5] Loading serialized registry and FAISS candidate pairs...")
df_preprocessed = pl.read_parquet(input_preprocessed, columns=[
    'company_number', 'company_name_clean', 'address_line1',
    'post_town_clean', 'postcode_clean', 'company_category'
])
df_serialized = pl.read_parquet(input_serialized, columns=['company_number', 'serialized_text'])
df_merged = df_preprocessed.join(df_serialized, on='company_number', how='inner')
df_candidates = pl.read_parquet(input_candidates)

print(f"-> Serialized entities available: {len(df_merged):,}")
print(f"-> FAISS candidate pairs available: {len(df_candidates):,}")

# Build lookup dictionary for quick retrieval
entities_dict = {}
for row in df_merged.head(10000).iter_rows(named=True):
    entities_dict[row['company_number']] = row

# Step 2: Realistic Noise Injection for Synthetic Positive Pairs
print("\n[2/5] Synthesizing Positive Pairs (Typo, Word Drop, Address Scramble)...")

STREET_ABBREVS = {
    'street': 'st', 'road': 'rd', 'avenue': 'ave', 'lane': 'ln',
    'drive': 'dr', 'court': 'ct', 'place': 'pl', 'house': 'hse',
    'centre': 'ctr', 'center': 'ctr', 'park': 'pk'
}

def inject_typo(text):
    """Injects realistic keystroke typos: transposition, deletion, or substitution."""
    words = text.split()
    if not words:
        return text
    target_idx = random.randint(0, len(words) - 1)
    chars = list(words[target_idx])
    if len(chars) > 3:
        mutation = random.choice(['transpose', 'delete', 'substitute', 'double'])
        pos = random.randint(0, len(chars) - 2)
        if mutation == 'transpose':
            chars[pos], chars[pos+1] = chars[pos+1], chars[pos]
        elif mutation == 'delete':
            chars.pop(pos)
        elif mutation == 'substitute':
            qwerty_neighbors = {'a': 's', 's': 'd', 'e': 'r', 'r': 't', 't': 'y', 'o': 'p', 'i': 'o', 'n': 'm'}
            c = chars[pos]
            chars[pos] = qwerty_neighbors.get(c, random.choice('abcdefghijklmnopqrstuvwxyz'))
        elif mutation == 'double':
            chars.insert(pos, chars[pos])
        words[target_idx] = "".join(chars)
    return " ".join(words)

def generate_synthetic_positive(record):
    """Transforms a clean company record into a realistic messy search/linkage query."""
    name = record['company_name_clean']
    addr = record['address_line1']
    town = record['post_town_clean']
    zip_code = record['postcode_clean']
    comp_type = record['company_category']
    
    # 1. Perturb company name (70% chance of typo or token dropout)
    if random.random() < 0.7:
        words = name.split()
        if len(words) > 2 and random.random() < 0.3:
            # Word dropout (e.g. drop non-essential words)
            drop_idx = random.randint(0, len(words) - 1)
            words.pop(drop_idx)
            name_aug = " ".join(words)
        else:
            name_aug = inject_typo(name)
    else:
        name_aug = name
        
    # 2. Address street abbreviation / scramble
    addr_aug = addr
    if addr:
        for full, abb in STREET_ABBREVS.items():
            if f" {full}" in f" {addr_aug}":
                addr_aug = addr_aug.replace(full, abb)
                break
                
    # 3. Postcode space toggle (50% chance of removing space: 'sw11 2hs' -> 'sw112hs')
    zip_aug = zip_code.replace(" ", "") if random.random() < 0.5 else zip_code
    
    # 4. Assemble serialized representation with potential omitted fields
    res = f"[NAME] {name_aug}"
    if addr_aug and random.random() < 0.75:  # 25% chance user didn't enter street
        res += f" [ADDR] {addr_aug}"
    if town:
        res += f" [TOWN] {town}"
    if zip_aug:
        res += f" [ZIP] {zip_aug}"
    if comp_type and random.random() < 0.5: # 50% chance user omitted legal structure
        res += f" [TYPE] {comp_type}"
        
    return res

# Generate synthetic positive pairs for sampled entities
synthetic_positive_pairs = []
unique_query_ids = df_candidates['query_company_number'].unique().to_list()

for cid in unique_query_ids:
    if cid in entities_dict:
        clean_row = entities_dict[cid]
        anchor_text = clean_row['serialized_text']
        positive_text = generate_synthetic_positive(clean_row)
        
        synthetic_positive_pairs.append({
            "query_id": cid,
            "candidate_id": cid,
            "text_a": anchor_text,
            "text_b": positive_text,
            "label": 1,
            "pair_type": "positive_synthetic",
            "faiss_similarity": 1.0
        })

print(f"-> Generated {len(synthetic_positive_pairs):,} synthetic positive pairs.")

# Step 3: Hard Negative Mining from FAISS
print("\n[3/5] Mining Hard Negatives from FAISS Top Candidates...")
# We select candidates from FAISS where candidate_id != query_id
# Exclude low-similarity pairs (similarity < 0.65) to ensure they are genuinely "hard"
hard_neg_candidates = df_candidates.filter(
    (pl.col('query_company_number') != pl.col('candidate_company_number')) &
    (pl.col('cosine_similarity') >= 0.70)
).sort('cosine_similarity', descending=True)

# Select top-1 hard negative per unique query for balanced 1:1 ratio
hard_neg_per_query = hard_neg_candidates.group_by('query_company_number').first()

hard_negative_pairs = []
for row in hard_neg_per_query.iter_rows(named=True):
    hard_negative_pairs.append({
        "query_id": row['query_company_number'],
        "candidate_id": row['candidate_company_number'],
        "text_a": row['query_serialized'],
        "text_b": row['candidate_serialized'],
        "label": 0,
        "pair_type": "hard_negative_faiss",
        "faiss_similarity": row['cosine_similarity']
    })

print(f"-> Mined {len(hard_negative_pairs):,} hard negative pairs from FAISS (Similarity >= 0.70).")

# Step 4: Assemble Balanced Pair Dataset & Triplet Dataset
print("\n[4/5] Assembling Balanced Classification & Triplet Datasets...")

# Harmonize pair sizes for a 50/50 balanced dataset
n_target = min(len(synthetic_positive_pairs), len(hard_negative_pairs))
final_positives = synthetic_positive_pairs[:n_target]
final_negatives = hard_negative_pairs[:n_target]

all_pairs = final_positives + final_negatives
random.shuffle(all_pairs)

df_all_pairs = pl.DataFrame(all_pairs)

# Triplet Format: (Anchor, Positive, Negative)
triplets = []
neg_dict = {row['query_id']: row for row in final_negatives}
for pos in final_positives:
    qid = pos['query_id']
    if qid in neg_dict:
        neg = neg_dict[qid]
        triplets.append({
            "query_id": qid,
            "negative_id": neg['candidate_id'],
            "anchor": pos['text_a'],
            "positive": pos['text_b'],
            "hard_negative": neg['text_b'],
            "negative_similarity": neg['faiss_similarity']
        })

df_triplets = pl.DataFrame(triplets)

# Train/Val Split (80% Train, 20% Validation)
split_idx = int(len(df_all_pairs) * 0.8)
df_train = df_all_pairs[:split_idx]
df_val = df_all_pairs[split_idx:]

# Save datasets
df_all_pairs.write_parquet(output_pairs_parquet, compression="snappy")
df_all_pairs.head(1000).write_csv(output_pairs_sample)
df_triplets.write_parquet(output_triplets_parquet, compression="snappy")
df_train.write_parquet(output_train_parquet, compression="snappy")
df_val.write_parquet(output_val_parquet, compression="snappy")

print(f"-> Full Pair Dataset: {len(df_all_pairs):,} pairs saved to {output_pairs_parquet}")
print(f"-> Train Set: {len(df_train):,} pairs ({output_train_parquet})")
print(f"-> Validation Set: {len(df_val):,} pairs ({output_val_parquet})")
print(f"-> Triplet Dataset: {len(df_triplets):,} triplets saved to {output_triplets_parquet}")
print(f"-> Sample CSV: {output_pairs_sample}")

# Step 5: Visualizing Hard Negatives vs Positives Distribution
chart_dir = os.path.join(PROJECT_ROOT, "reports", "figures")
os.makedirs(chart_dir, exist_ok=True)
chart_path = os.path.join(chart_dir, "hard_negatives_vs_positives.png")

plt.figure(figsize=(10, 5))
neg_sims = [row['faiss_similarity'] for row in final_negatives]
plt.hist(neg_sims, bins=40, color='#ef4444', alpha=0.7, edgecolor='#b91c1c', label='Hard Negatives (Cosine Similarity)')
plt.axvline(np.mean(neg_sims), color='#7f1d1d', linestyle='dashed', linewidth=2, label=f'Hard Neg Mean Sim: {np.mean(neg_sims):.3f}')
plt.title('Phase 4: Contrastive Learning Hard Negative Distribution', fontsize=12, fontweight='bold')
plt.xlabel('Initial FAISS Cosine Similarity (Before Fine-Tuning)', fontsize=10)
plt.ylabel('Pair Count', fontsize=10)
plt.legend(fontsize=10)
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig(chart_path, dpi=200)
plt.close()
print(f"-> Chart saved to: {chart_path}")

# Step 6: Dataset Audit & Examples
print("\n" + "=" * 70)
print("DATASET AUDIT: POSITIVE PAIR EXAMPLE (Same Entity, Injected Noise)")
print("=" * 70)
pos_eg = final_positives[0]
print(f"Query ID : {pos_eg['query_id']}")
print(f"Text A   : {pos_eg['text_a']}")
print(f"Text B   : {pos_eg['text_b']}")
print(f"Label    : {pos_eg['label']} ({pos_eg['pair_type']})")

print("\n" + "=" * 70)
print("DATASET AUDIT: HARD NEGATIVE PAIR EXAMPLE (High Similarity, Different Entity)")
print("=" * 70)
neg_eg = final_negatives[0]
print(f"Query ID    : {neg_eg['query_id']}")
print(f"Candidate ID: {neg_eg['candidate_id']}")
print(f"Text A      : {neg_eg['text_a']}")
print(f"Text B      : {neg_eg['text_b']}")
print(f"FAISS Sim   : {neg_eg['faiss_similarity']:.4f}")
print(f"Label       : {neg_eg['label']} ({neg_eg['pair_type']})")

print(f"\nPhase 4 pipeline completed in {time.time() - t_start:.2f} seconds.")
