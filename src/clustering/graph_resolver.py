import sys
import os
import time
import json
import torch
import polars as pl
import numpy as np
import networkx as nx
from transformers import AutoModelForSequenceClassification, AutoTokenizer
import matplotlib.pyplot as plt

# Ensure UTF-8 output
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

print("=" * 70)
print("PHASE 6: SCORING, THRESHOLDING & GRAPH CLUSTERING")
print("Translating Transformer Probabilities into Consolidated Entity Graph")
print("=" * 70)

t_start = time.time()
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
model_dir = os.path.join(PROJECT_ROOT, "models", "fine_tuned_cross_encoder")
candidates_parquet = os.path.join(PROJECT_ROOT, "data", "processed", "candidate_pairs_top10.parquet")
preprocessed_parquet = os.path.join(PROJECT_ROOT, "data", "interim", "preprocessed_companies.parquet")
output_edges_parquet = os.path.join(PROJECT_ROOT, "data", "processed", "verified_match_edges.parquet")
output_entities_parquet = os.path.join(PROJECT_ROOT, "data", "processed", "consolidated_entities.parquet")
output_sample_csv = os.path.join(PROJECT_ROOT, "data", "processed", "consolidated_entities_sample.csv")
chart_dir = os.path.join(PROJECT_ROOT, "reports", "figures")
os.makedirs(chart_dir, exist_ok=True)

# Configuration
THRESHOLD = 0.85
FAISS_SIM_PREFILTER = 0.85
BATCH_SIZE = 64
torch.set_num_threads(16)
device = "cpu"

# Step 1: Load Fine-Tuned Cross-Encoder Model & Tokenizer
print(f"[1/5] Loading Fine-Tuned Cross-Encoder from: {model_dir}...")
tokenizer = AutoTokenizer.from_pretrained(model_dir)
model = AutoModelForSequenceClassification.from_pretrained(model_dir).to(device)
model.eval()
print(f"-> Model & Tokenizer loaded successfully on {device}.")

# Step 2: Load FAISS Candidates
print(f"\n[2/5] Loading FAISS Candidates from {candidates_parquet}...")
df_cand = pl.read_parquet(candidates_parquet)
total_candidates = len(df_cand)
print(f"-> Total FAISS candidate pairs: {total_candidates:,}")

# Filter candidate pairs to evaluate
# Focus on high-confidence FAISS pairs (cosine similarity >= 0.85) to optimize throughput
cand_subset = df_cand.filter(
    (pl.col('query_company_number') != pl.col('candidate_company_number')) &
    (pl.col('cosine_similarity') >= FAISS_SIM_PREFILTER)
)
print(f"-> Pairs passed to Cross-Encoder (FAISS Cosine Sim >= {FAISS_SIM_PREFILTER}): {len(cand_subset):,}")

# Deduplicate symmetric pairs: if (A, B) exists, don't score (B, A) twice
pairs_to_score = []
seen_pairs = set()

for row in cand_subset.iter_rows(named=True):
    u = row['query_company_number']
    v = row['candidate_company_number']
    pair_key = tuple(sorted([u, v]))
    if pair_key not in seen_pairs:
        seen_pairs.add(pair_key)
        pairs_to_score.append({
            'company_a': u,
            'company_b': v,
            'text_a': row['query_serialized'],
            'text_b': row['candidate_serialized'],
            'faiss_similarity': row['cosine_similarity']
        })

print(f"-> Unique undirected pairs to score: {len(pairs_to_score):,}")

# Step 3: Simultaneous Scoring via Cross-Encoder
print(f"\n[3/5] Scoring Pairs with Full Cross-Attention (Record A [SEP] Record B)...")
t_score_start = time.time()

all_probs = []
num_batches = (len(pairs_to_score) + BATCH_SIZE - 1) // BATCH_SIZE

with torch.no_grad():
    for b in range(num_batches):
        batch = pairs_to_score[b * BATCH_SIZE : (b + 1) * BATCH_SIZE]
        texts_a = [p['text_a'] for p in batch]
        texts_b = [p['text_b'] for p in batch]
        
        inputs = tokenizer(
            texts_a,
            texts_b,
            padding=True,
            truncation=True,
            max_length=128,
            return_tensors='pt'
        ).to(device)
        
        logits = model(**inputs).logits.squeeze(-1)
        probs = torch.sigmoid(logits).cpu().numpy()
        if probs.ndim == 0:
            probs = np.array([probs.item()])
        all_probs.extend(probs)
        
        if (b + 1) % 25 == 0 or (b + 1) == num_batches:
            print(f"   Scored {min((b + 1) * BATCH_SIZE, len(pairs_to_score)):,} / {len(pairs_to_score):,} pairs ({(b+1)/num_batches*100:.1f}%)")

t_score_elapsed = time.time() - t_score_start
print(f"-> Scoring completed in {t_score_elapsed:.2f}s ({len(pairs_to_score)/t_score_elapsed:.1f} pairs/sec)")

for i, p in enumerate(all_probs):
    pairs_to_score[i]['cross_encoder_probability'] = float(round(p, 4))

# Step 4: Apply Decision Threshold (P >= 0.85)
print(f"\n[4/5] Applying Decision Threshold: P(Match) >= {THRESHOLD}...")
df_scored = pl.DataFrame(pairs_to_score)
verified_edges = df_scored.filter(pl.col('cross_encoder_probability') >= THRESHOLD)

print(f"-> Pairs evaluated        : {len(df_scored):,}")
print(f"-> Verified Match Edges   : {len(verified_edges):,} ({len(verified_edges)/len(df_scored)*100:.2f}% accepted)")
print(f"-> Discarded Non-Matches  : {len(df_scored) - len(verified_edges):,} ({100 - len(verified_edges)/len(df_scored)*100:.2f}% rejected)")

verified_edges.write_parquet(output_edges_parquet, compression="snappy")
print(f"-> Verified edges saved to: {output_edges_parquet}")

# Step 5: Graph Construction & Connected Components Clustering
print(f"\n[5/5] Building Graph & Computing Connected Components (Transitive Closure)...")

# Collect all unique entities from candidate pool
all_entities = set(df_cand['query_company_number'].unique().to_list())

G = nx.Graph()
# Add all entities as nodes
for e in all_entities:
    G.add_node(e)

# Add verified match edges
for row in verified_edges.iter_rows(named=True):
    G.add_edge(row['company_a'], row['company_b'], weight=row['cross_encoder_probability'])

print(f"-> Graph initialized: {G.number_of_nodes():,} nodes | {G.number_of_edges():,} verified edges")

# Compute connected components
components = list(nx.connected_components(G))
total_components = len(components)
print(f"-> Total Consolidated Business Entities (Connected Components): {total_components:,}")

# Load metadata for Golden Record resolution
meta_df = pl.read_parquet(
    preprocessed_parquet,
    columns=['company_number', 'company_name_raw', 'company_name_clean', 'post_town_clean', 'postcode_clean', 'company_status', 'incorporation_date']
)
meta_dict = {row['company_number']: row for row in meta_df.iter_rows(named=True) if row['company_number'] in all_entities}

# Build Entity Cluster Table
consolidated_rows = []
multi_record_clusters = 0
cluster_sizes = []

for cluster_idx, comp in enumerate(sorted(components, key=len, reverse=True), start=1):
    entity_id = f"ENT_{cluster_idx:06d}"
    comp_list = list(comp)
    c_size = len(comp_list)
    cluster_sizes.append(c_size)
    if c_size > 1:
        multi_record_clusters += 1
        
    # Golden Record Selection Strategy:
    # 1. Prefer 'Active' status
    # 2. Prefer oldest incorporation date
    # 3. Longest name / most complete
    best_rec = None
    for cid in comp_list:
        rec = meta_dict.get(cid, {'company_number': cid, 'company_name_clean': '', 'company_status': '', 'incorporation_date': '99/99/9999'})
        if best_rec is None:
            best_rec = rec
        else:
            # Active check
            curr_active = 1 if rec.get('company_status') == 'active' else 0
            best_active = 1 if best_rec.get('company_status') == 'active' else 0
            if curr_active > best_active:
                best_rec = rec
            elif curr_active == best_active:
                # Year check
                curr_year = rec.get('incorporation_date', '9999')[-4:]
                best_year = best_rec.get('incorporation_date', '9999')[-4:]
                if curr_year < best_year:
                    best_rec = rec
                    
    canonical_id = best_rec['company_number']
    canonical_name = best_rec.get('company_name_clean', '')
    
    for cid in comp_list:
        rec = meta_dict.get(cid, {})
        consolidated_rows.append({
            'unified_entity_id': entity_id,
            'company_number': cid,
            'company_name': rec.get('company_name_clean', ''),
            'post_town': rec.get('post_town_clean', ''),
            'postcode': rec.get('postcode_clean', ''),
            'incorporation_date': rec.get('incorporation_date', ''),
            'company_status': rec.get('company_status', ''),
            'cluster_size': c_size,
            'is_canonical_record': (cid == canonical_id),
            'canonical_company_number': canonical_id,
            'canonical_company_name': canonical_name
        })

df_consolidated = pl.DataFrame(consolidated_rows)
df_consolidated.write_parquet(output_entities_parquet, compression="snappy")
df_consolidated.head(1000).write_csv(output_sample_csv)

print(f"-> Consolidated entity mapping saved to: {output_entities_parquet}")
print(f"-> Sample exported to: {output_sample_csv}")

# Step 6: Clustering Analytics & Distribution
print("\n" + "=" * 70)
print("GRAPH CLUSTERING & CONSOLIDATION SUMMARY")
print("=" * 70)
print(f"Total Raw Records Evaluated    : {len(all_entities):,}")
print(f"Total Consolidated Entities    : {total_components:,}")
print(f"Multi-Record Entity Clusters   : {multi_record_clusters:,}")
print(f"Singletons (Unique Businesses) : {total_components - multi_record_clusters:,}")
print(f"Largest Cluster Size           : {max(cluster_sizes)} linked company records")
print(f"Record Consolidation Ratio     : {(1.0 - total_components / len(all_entities)) * 100:.2f}%")

# Generate Cluster Distribution Chart
chart_path = os.path.join(chart_dir, "cluster_size_distribution.png")
fig, ax = plt.subplots(figsize=(9, 5))
size_counts = {}
for s in cluster_sizes:
    size_counts[s] = size_counts.get(s, 0) + 1

categories = ['Singletons (Size 1)', 'Pairs (Size 2)', 'Triplets (Size 3)', 'Clusters (Size 4+)']
counts = [
    size_counts.get(1, 0),
    size_counts.get(2, 0),
    size_counts.get(3, 0),
    sum(v for k, v in size_counts.items() if k >= 4)
]

bars = ax.bar(categories, counts, color=['#94a3b8', '#3b82f6', '#10b981', '#f59e0b'])
ax.set_ylabel('Number of Entity Clusters', fontsize=11)
ax.set_title('Phase 6: Consolidated Entity Graph - Cluster Size Distribution', fontsize=13, fontweight='bold')
ax.set_yscale('log')
ax.grid(axis='y', linestyle='--', alpha=0.5)

for bar, count in zip(bars, counts):
    yval = bar.get_height()
    ax.text(bar.get_x() + bar.get_width()/2.0, yval * 1.15, f"{count:,}", ha='center', va='bottom', fontsize=10, fontweight='bold')

plt.tight_layout()
plt.savefig(chart_path, dpi=200)
plt.close()
print(f"-> Cluster chart saved to: {chart_path}")

# Step 7: Inspect Top Consolidated Multi-Entity Clusters
print("\n" + "=" * 70)
print("AUDIT: TOP CONSOLIDATED MULTI-RECORD CLUSTERS")
print("=" * 70)

top_clusters = df_consolidated.filter(pl.col('cluster_size') > 1).group_by('unified_entity_id').all().sort('cluster_size', descending=True).head(5)

for c in top_clusters.iter_rows(named=True):
    eid = c['unified_entity_id']
    size = len(c['company_number'])
    print(f"\nUnified Entity: {eid} | Cluster Size: {size} Companies")
    for i in range(min(size, 5)):
        is_canon = " [CANONICAL]" if c['is_canonical_record'][i] else ""
        print(f"  * Company [{c['company_number'][i]}]: {c['company_name'][i]} | Town: {c['post_town'][i]} | Postcode: {c['postcode'][i]}{is_canon}")

print(f"\nPhase 6 pipeline completed in {time.time() - t_start:.2f} seconds.")
