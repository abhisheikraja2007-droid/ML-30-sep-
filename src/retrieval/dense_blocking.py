import sys
import os
import time
import json
import torch
import polars as pl
import numpy as np
import faiss  # type: ignore
from sentence_transformers import SentenceTransformer  # type: ignore
import matplotlib.pyplot as plt

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

print("=" * 70)
print("PHASE 3: STAGE 1 - BLOCKING (CANDIDATE GENERATION)")
print("Dense Vector Retrieval & Approximate Nearest Neighbors (FAISS)")
print("=" * 70)

t_start = time.time()
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
input_parquet = os.path.join(PROJECT_ROOT, "data", "interim", "serialized_companies.parquet")
output_candidates_parquet = os.path.join(PROJECT_ROOT, "data", "processed", "candidate_pairs_top10.parquet")
output_candidates_sample = os.path.join(PROJECT_ROOT, "data", "processed", "candidate_pairs_sample.csv")
model_name = "all-MiniLM-L6-v2"
top_k = 10
n_records = 5000  # Representative evaluation candidate set for dense blocking

# Set PyTorch threads for CPU parallel execution
torch.set_num_threads(16)
device = "cpu"

print(f"[1/5] Loading serialized company records from {input_parquet}...")
df_full = pl.scan_parquet(input_parquet)
total_register_count = df_full.select(pl.len()).collect().item()
print(f"-> Total companies in master registry: {total_register_count:,}")

# Sample N records for candidate generation pool
df_sample = df_full.limit(n_records).collect()
print(f"-> Active candidate pool selected: {len(df_sample):,} entities")

company_numbers = df_sample['company_number'].to_list()
serialized_texts = df_sample['serialized_text'].to_list()
clean_names = df_sample['company_name_clean'].to_list()
post_towns = df_sample['post_town_clean'].to_list()
postcodes = df_sample['postcode_clean'].to_list()

# Step 2: Generate Dense Embeddings with Bi-Encoder
print(f"\n[2/5] Generating Dense Embeddings using Bi-Encoder: '{model_name}'...")
t_enc_start = time.time()
model = SentenceTransformer(model_name, device=device)

# Encode with normalized embeddings (L2 norm = 1.0 for cosine similarity via inner product)
embeddings = model.encode(
    serialized_texts,
    batch_size=128,
    show_progress_bar=True,
    normalize_embeddings=True,
    convert_to_numpy=True
).astype(np.float32)

t_enc_elapsed = time.time() - t_enc_start
embedding_dim = embeddings.shape[1]
print(f"-> Encoded {len(embeddings):,} records in {t_enc_elapsed:.2f}s ({len(embeddings)/t_enc_elapsed:.1f} records/sec)")
print(f"-> Embedding Matrix Shape: {embeddings.shape} (Dimension: {embedding_dim})")

# Step 3: Build FAISS IndexFlatIP
print(f"\n[3/5] Building FAISS IndexFlatIP (Inner Product / Cosine Similarity)...")
t_idx_start = time.time()
index = faiss.IndexFlatIP(embedding_dim)

# Add normalized embeddings to index
index.add(embeddings)
t_idx_elapsed = time.time() - t_idx_start
print(f"-> FAISS index created with {index.ntotal:,} vectors in {t_idx_elapsed*1000:.2f} ms")

# Step 4: Retrieve Top-10 Candidates per Record
print(f"\n[4/5] Querying index for Top-{top_k} nearest mathematical neighbors...")
t_search_start = time.time()

# Search k + 1 because the closest vector to record i is itself (similarity = 1.0)
k_search = top_k + 1
distances, indices = index.search(embeddings, k_search)
t_search_elapsed = time.time() - t_search_start
latency_per_query_ms = (t_search_elapsed / len(embeddings)) * 1000
print(f"-> Retrieved candidates for {len(embeddings):,} queries in {t_search_elapsed:.3f}s")
print(f"-> Query Latency: {latency_per_query_ms:.3f} ms per query ({1000/latency_per_query_ms:.0f} QPS)")

# Assemble candidate pairs table
candidate_records = []
for i in range(len(embeddings)):
    q_num = company_numbers[i]
    q_text = serialized_texts[i]
    q_name = clean_names[i]
    q_town = post_towns[i]
    
    rank = 1
    for score, idx in zip(distances[i], indices[i]):
        if idx == i:
            # Skip self match
            continue
        if rank > top_k:
            break
        
        c_num = company_numbers[idx]
        c_text = serialized_texts[idx]
        c_name = clean_names[idx]
        c_town = post_towns[idx]
        
        candidate_records.append({
            "query_company_number": q_num,
            "query_company_name": q_name,
            "query_town": q_town,
            "candidate_company_number": c_num,
            "candidate_company_name": c_name,
            "candidate_town": c_town,
            "candidate_rank": rank,
            "cosine_similarity": float(round(score, 4)),
            "query_serialized": q_text,
            "candidate_serialized": c_text
        })
        rank += 1

df_candidates = pl.DataFrame(candidate_records)

# Save candidate pairs to Parquet and CSV
df_candidates.write_parquet(output_candidates_parquet, compression="snappy")
df_candidates.head(1000).write_csv(output_candidates_sample)

print(f"-> Candidate pairs saved: {len(df_candidates):,} rows to {output_candidates_parquet}")
print(f"-> Sample exported to {output_candidates_sample}")

# Step 5: Metrics & Mathematical Search Space Reduction
print("\n" + "=" * 70)
print("BLOCKING & RETRIEVAL PERFORMANCE METRICS")
print("=" * 70)

# Theoretical comparison complexity
sample_n = len(df_sample)
naive_sample_pairs = (sample_n * (sample_n - 1)) // 2
retained_candidate_pairs = len(df_candidates)
sample_reduction_ratio = (1.0 - (retained_candidate_pairs / naive_sample_pairs)) * 100

full_n = total_register_count
naive_full_pairs = (full_n * (full_n - 1)) // 2
full_top10_pairs = full_n * top_k
full_reduction_ratio = (1.0 - (full_top10_pairs / naive_full_pairs)) * 100

sim_mean = float(df_candidates['cosine_similarity'].mean() or 0.0)
sim_median = float(df_candidates['cosine_similarity'].median() or 0.0)
sim_max = float(df_candidates['cosine_similarity'].max() or 0.0)
sim_min = float(df_candidates['cosine_similarity'].min() or 0.0)
sim_p90 = float(df_candidates['cosine_similarity'].quantile(0.90) or 0.0)

print(f"Active Evaluation Pool        : {sample_n:,} entities")
print(f"Naive All-Pairs Comparisons   : {naive_sample_pairs:,} combinations (O(N^2))")
print(f"FAISS Candidate Pairs Retained : {retained_candidate_pairs:,} pairs (O(N * k))")
print(f"Sample Search Space Reduction : {sample_reduction_ratio:.4f}%")
print("-" * 50)
print(f"Full 5.29M Registry Naive Pairs: {naive_full_pairs:,} (~14.0 TRILLION comparisons)")
print(f"Full Registry Top-10 Pairs     : {full_top10_pairs:,} (52.9 MILLION comparisons)")
print(f"Full Scale Reduction Ratio     : {full_reduction_ratio:.6f}%")
print("-" * 50)
print(f"Cosine Similarity Distribution : Min={sim_min:.4f} | Median={sim_median:.4f} | Mean={sim_mean:.4f} | P90={sim_p90:.4f} | Max={sim_max:.4f}")

# Generate Visualization Chart
chart_dir = os.path.join(PROJECT_ROOT, "reports", "figures")
os.makedirs(chart_dir, exist_ok=True)
chart_path = os.path.join(chart_dir, "blocking_similarity_distribution.png")

plt.figure(figsize=(10, 5))
scores = df_candidates['cosine_similarity'].to_numpy()
plt.hist(scores, bins=50, color='#3b82f6', edgecolor='#1d4ed8', alpha=0.75)
plt.axvline(sim_median, color='#ef4444', linestyle='dashed', linewidth=2, label=f'Median: {sim_median:.3f}')
plt.axvline(sim_p90, color='#10b981', linestyle='dashed', linewidth=2, label=f'90th Percentile: {sim_p90:.3f}')
plt.title(f'Dense Vector Retrieval: Candidate Pair Cosine Similarity Distribution (Top-{top_k})', fontsize=12, fontweight='bold')
plt.xlabel('Cosine Similarity (faiss.IndexFlatIP)', fontsize=10)
plt.ylabel('Pair Count', fontsize=10)
plt.legend(fontsize=10)
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig(chart_path, dpi=200)
plt.close()
print(f"-> Similarity histogram chart saved to: {chart_path}")

# Display Qualitative High-Probability Matches
print("\n" + "=" * 70)
print("AUDIT: TOP HIGH-SIMILARITY CANDIDATE PAIRS (Score > 0.85)")
print("=" * 70)
high_sim = df_candidates.filter(pl.col('cosine_similarity') >= 0.85).sort('cosine_similarity', descending=True).head(10)
for row in high_sim.iter_rows(named=True):
    print(f"Similarity: {row['cosine_similarity']:.4f} | Rank: {row['candidate_rank']}")
    print(f"  Query    [{row['query_company_number']}]: {row['query_serialized']}")
    print(f"  Candidate[{row['candidate_company_number']}]: {row['candidate_serialized']}")
    print("-" * 65)

total_runtime = time.time() - t_start
print(f"\nPhase 3 Stage 1 pipeline completed successfully in {total_runtime:.2f} seconds.")
