"""
Phase 8: Thresholding & Graph Clustering (The Final Output)
===========================================================
Applies the Phase 7 Meta-Classifier ensemble probability to candidate pairs,
enforces high-precision thresholding (P >= 0.90), constructs the corporate
graph, computes connected components, and generates unified Golden Records.

Steps:
  1. Load Meta-Classifier model bundle & production FAISS candidate pairs.
  2. Extract character & null indicator features + Cross-Encoder deep semantic score.
  3. Score pairs via Meta-Classifier: compute final ensemble match probability.
  4. Apply Thresholding: Discard any candidate pair with P(Match) < 0.90.
  5. Build NetworkX graph from surviving high-confidence edges.
  6. Compute Connected Components (Transitive Closure across duplicates/variants).
  7. Golden Record Generation:
     - Group matched nodes and assign a single unified ENT_ID (e.g. ENT_000001).
     - Select canonical record by active status, oldest incorporation date, and completeness.
  8. Export consolidated entity mappings, golden records, and metrics audit.
"""

import os
import sys
import json
import time
import pickle
import numpy as np
import polars as pl
import networkx as nx
import torch
from sentence_transformers import CrossEncoder
from tqdm import tqdm
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from src.matching.feature_engineering import compute_pair_features

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# ---------------------------------------------------------------------------
# Configuration & Paths
# ---------------------------------------------------------------------------
MODEL_PKL_PATH = os.path.join(PROJECT_ROOT, "models", "meta_classifier", "meta_classifier.pkl")
CROSS_ENCODER_DIR = os.path.join(PROJECT_ROOT, "models", "fine_tuned_cross_encoder")
CANDIDATES_PATH = os.path.join(PROJECT_ROOT, "data", "processed", "candidate_pairs_top10.parquet")
PREPROCESSED_PATH = os.path.join(PROJECT_ROOT, "data", "interim", "preprocessed_companies.parquet")

OUT_EDGES_PARQUET = os.path.join(PROJECT_ROOT, "data", "processed", "verified_ensemble_edges.parquet")
OUT_ENTITIES_PARQUET = os.path.join(PROJECT_ROOT, "data", "processed", "final_consolidated_entities.parquet")
OUT_GOLDEN_PARQUET = os.path.join(PROJECT_ROOT, "data", "processed", "golden_records.parquet")
OUT_METRICS_PATH = os.path.join(PROJECT_ROOT, "reports", "metrics", "phase8_clustering_stats.json")
OUT_REPORT_PATH = os.path.join(PROJECT_ROOT, "reports", "phase8_thresholding_clustering_report.md")

THRESHOLD = 0.90             # Strictly discard any pair with probability < 0.90
FAISS_SIM_PREFILTER = 0.85   # Candidate retrieval pool cutoff
BATCH_SIZE = 64
torch.set_num_threads(16)

os.makedirs(os.path.join(PROJECT_ROOT, "data", "processed"), exist_ok=True)
os.makedirs(os.path.join(PROJECT_ROOT, "reports", "metrics"), exist_ok=True)

print("=" * 78)
print("PHASE 8: THRESHOLDING & GRAPH CLUSTERING (THE FINAL OUTPUT)")
print(f"Applying Meta-Classifier Threshold (P >= {THRESHOLD:.2f}) -> Entity Graph -> Golden Records")
print("=" * 78)

# ---------------------------------------------------------------------------
# Step 1: Load Models (Cross-Encoder & Meta-Classifier)
# ---------------------------------------------------------------------------
print(f"\n[1/6] Loading Meta-Classifier bundle from: {MODEL_PKL_PATH}...")
if not os.path.exists(MODEL_PKL_PATH):
    raise FileNotFoundError(f"Meta-Classifier bundle not found at {MODEL_PKL_PATH}. Run Phase 7 first.")

with open(MODEL_PKL_PATH, "rb") as f:
    bundle = pickle.load(f)

meta_model = bundle["model"]
model_type = bundle.get("model_type", "lightgbm")
feature_cols = bundle["features"]
print(f"  -> Meta-Classifier:   {model_type.upper()} ({len(feature_cols)} features)")

print(f"\n[2/6] Loading Fine-Tuned Cross-Encoder from: {CROSS_ENCODER_DIR}...")
cross_encoder = CrossEncoder(CROSS_ENCODER_DIR, device="cpu")
print("  -> Cross-Encoder loaded on CPU.")

# ---------------------------------------------------------------------------
# Step 2: Load & Deduplicate FAISS Production Candidate Pairs
# ---------------------------------------------------------------------------
print(f"\n[3/6] Loading production candidate pairs from: {CANDIDATES_PATH}...")
df_cand = pl.read_parquet(CANDIDATES_PATH)
total_candidates = len(df_cand)
print(f"  -> Total candidate pairs retrieved: {total_candidates:,}")

# Filter to candidate pairs across different registered company numbers
cand_subset = df_cand.filter(
    (pl.col("query_company_number") != pl.col("candidate_company_number")) &
    (pl.col("cosine_similarity") >= FAISS_SIM_PREFILTER)
)
print(f"  -> Candidate pairs with Cosine Sim >= {FAISS_SIM_PREFILTER}: {len(cand_subset):,}")

# Deduplicate symmetric pairs: (A, B) and (B, A) represent the same undirected edge
unique_pairs = []
seen_pairs = set()

for row in cand_subset.iter_rows(named=True):
    u = str(row["query_company_number"])
    v = str(row["candidate_company_number"])
    pair_key = tuple(sorted([u, v]))
    if pair_key not in seen_pairs:
        seen_pairs.add(pair_key)
        unique_pairs.append({
            "company_a": u,
            "company_b": v,
            "text_a": row["query_serialized"],
            "text_b": row["candidate_serialized"],
            "faiss_similarity": float(row["cosine_similarity"]),
        })

print(f"  -> Unique undirected pairs to score: {len(unique_pairs):,}")

# Collect all company entities in the candidate pool for full resolution
all_entities = set(df_cand["query_company_number"].unique().to_list())
print(f"  -> Total unique business entities in pool: {len(all_entities):,}")

# ---------------------------------------------------------------------------
# Step 3: Extract Character Features & Deep Semantic Scores
# ---------------------------------------------------------------------------
print("\n[4/6] Extracting deterministic features and Cross-Encoder scores...")
texts_a = [p["text_a"] for p in unique_pairs]
texts_b = [p["text_b"] for p in unique_pairs]

# 1. Deterministic character features
t0 = time.time()
feat_rows = [compute_pair_features(ta, tb) for ta, tb in zip(texts_a, texts_b)]
t_feat = time.time() - t0
print(f"  -> Character features computed in {t_feat:.2f}s ({len(feat_rows)/t_feat:,.0f} pairs/sec)")

# 2. Deep neural semantic scores from Cross-Encoder
t0 = time.time()
ce_input_pairs = [[ta, tb] for ta, tb in zip(texts_a, texts_b)]
ce_scores = cross_encoder.predict(ce_input_pairs, batch_size=BATCH_SIZE, show_progress_bar=True)
t_ce = time.time() - t0
print(f"  -> Cross-Encoder inference in {t_ce:.2f}s ({len(ce_scores)/t_ce:,.0f} pairs/sec)")

# 3. Assemble feature matrix for Meta-Classifier
records_to_score = []
for i, feat in enumerate(feat_rows):
    rec = dict(feat)
    rec["cross_encoder_score"] = float(ce_scores[i])
    
    # Add sparsity columns
    rec["address_jaro_sparsity"] = np.nan if (rec["is_address_missing_a"] == 1 or rec["is_address_missing_b"] == 1) else rec["address_jaro"]
    rec["town_jaro_sparsity"] = np.nan if (rec["is_town_missing_a"] == 1 or rec["is_town_missing_b"] == 1) else rec["town_jaro_winkler"]
    rec["postcode_jaro_sparsity"] = np.nan if (rec["is_postcode_missing_a"] == 1 or rec["is_postcode_missing_b"] == 1) else rec["postcode_jaro"]
    
    records_to_score.append([rec.get(col, np.nan) for col in feature_cols])

X_prod = np.array(records_to_score)

# ---------------------------------------------------------------------------
# Step 4: Apply Meta-Classifier & Enforce Threshold >= 0.90
# ---------------------------------------------------------------------------
print(f"\n[5/6] Meta-Classifier scoring & applying high-confidence threshold P >= {THRESHOLD:.2f}...")
t0 = time.time()
ensemble_probs = meta_model.predict_proba(X_prod)[:, 1]
t_meta = time.time() - t0
print(f"  -> Meta-Classifier scored in {t_meta:.3f}s ({len(ensemble_probs)/t_meta:,.0f} pairs/sec)")

surviving_edges = []
discarded_count = 0

for i, p in enumerate(ensemble_probs):
    p_val = float(round(p, 4))
    pair_info = unique_pairs[i]
    pair_info["ensemble_probability"] = p_val
    pair_info["cross_encoder_score"] = float(round(ce_scores[i], 4))
    
    if p_val >= THRESHOLD:
        surviving_edges.append(pair_info)
    else:
        discarded_count += 1

total_scored = len(unique_pairs)
accepted_count = len(surviving_edges)

print(f"  -> Candidate pairs scored:  {total_scored:,}")
print(f"  -> High-confidence edges:   {accepted_count:,} ({accepted_count / total_scored * 100:.2f}% accepted)")
print(f"  -> Discarded pairs (<0.90): {discarded_count:,} ({discarded_count / total_scored * 100:.2f}% rejected)")

# Save verified high-confidence edges
df_edges = pl.DataFrame([
    {
        "company_a": e["company_a"],
        "company_b": e["company_b"],
        "ensemble_probability": e["ensemble_probability"],
        "cross_encoder_score": e["cross_encoder_score"],
        "faiss_similarity": e["faiss_similarity"],
    }
    for e in surviving_edges
])
df_edges.write_parquet(OUT_EDGES_PARQUET, compression="snappy")
print(f"  -> Verified edges saved to: {OUT_EDGES_PARQUET}")

# ---------------------------------------------------------------------------
# Step 5: Graph Construction & Connected Components (Transitive Closure)
# ---------------------------------------------------------------------------
print("\n[6/6] Building Graph, Computing Connected Components & Generating Golden Records...")

G = nx.Graph()

# Add all 50,000 entities from the candidate pool as nodes
for e in all_entities:
    G.add_node(str(e))

# Add surviving verified match edges
for e in surviving_edges:
    G.add_edge(e["company_a"], e["company_b"], weight=e["ensemble_probability"])

num_nodes = G.number_of_nodes()
num_edges = G.number_of_edges()
components = list(nx.connected_components(G))
total_components = len(components)

print(f"  -> Graph initialized:          {num_nodes:,} nodes | {num_edges:,} verified edges")
print(f"  -> Total Entity Clusters:      {total_components:,} connected components")

comp_sizes = [len(c) for c in components]
multi_record_clusters = sum(1 for s in comp_sizes if s > 1)
max_cluster_size = max(comp_sizes) if comp_sizes else 0
print(f"  -> Multi-record clusters (>1): {multi_record_clusters:,}")
print(f"  -> Maximum cluster size:       {max_cluster_size}")

# Load metadata for Golden Record resolution
print("  -> Fetching Companies House metadata for Golden Record selection...")
meta_df = pl.read_parquet(
    PREPROCESSED_PATH,
    columns=[
        "company_number", "company_name_raw", "company_name_clean",
        "post_town_clean", "postcode_clean", "company_status",
        "incorporation_date", "company_category", "primary_sic_text"
    ]
).filter(pl.col("company_number").is_in(list(all_entities)))

meta_dict = {
    row["company_number"]: row
    for row in meta_df.iter_rows(named=True)
}
print(f"  -> Matched metadata for {len(meta_dict):,} records.")

def select_golden_record(cluster_members: list[str]) -> dict:
    """
    Selects the canonical Golden Record from a cluster of messy variants:
      1. Priority 1: Active status ('active' > dissolved/liquidation/other)
      2. Priority 2: Oldest incorporation date (first registered legal entity)
      3. Priority 3: Completeness of address & name
    """
    candidates = []
    for cid in cluster_members:
        rec = meta_dict.get(cid, {
            "company_number": cid,
            "company_name_raw": f"COMPANY {cid}",
            "company_name_clean": f"COMPANY {cid}",
            "post_town_clean": "",
            "postcode_clean": "",
            "company_status": "unknown",
            "incorporation_date": "9999-12-31",
            "company_category": "",
            "primary_sic_text": "",
        })
        is_active = 1 if str(rec.get("company_status", "")).lower() == "active" else 0
        inc_date = str(rec.get("incorporation_date") or "9999-12-31")
        year = inc_date[-4:] if "/" in inc_date else inc_date[:4]
        try:
            year_val = int(year)
        except ValueError:
            year_val = 9999
            
        completeness = sum([
            1 if rec.get("company_name_clean") else 0,
            1 if rec.get("post_town_clean") else 0,
            1 if rec.get("postcode_clean") else 0,
            1 if rec.get("primary_sic_text") else 0,
        ])
        candidates.append((cid, rec, is_active, year_val, completeness))

    candidates.sort(key=lambda x: (-x[2], x[3], -x[4]))
    return candidates[0][1]

consolidated_entity_rows = []
golden_record_rows = []

components_sorted = sorted(components, key=len, reverse=True)

for idx, comp in enumerate(components_sorted, start=1):
    unified_ent_id = f"ENT_{idx:06d}"
    members = list(comp)
    golden_rec = select_golden_record(members)
    canonical_num = golden_rec["company_number"]
    canonical_name = golden_rec.get("company_name_clean") or golden_rec.get("company_name_raw")

    golden_record_rows.append({
        "unified_ent_id": unified_ent_id,
        "canonical_company_number": canonical_num,
        "canonical_name": canonical_name,
        "company_status": golden_rec.get("company_status"),
        "incorporation_date": golden_rec.get("incorporation_date"),
        "post_town": golden_rec.get("post_town_clean"),
        "postcode": golden_rec.get("postcode_clean"),
        "cluster_size": len(members),
        "cluster_members": members,
    })

    for m in members:
        m_rec = meta_dict.get(m, {})
        consolidated_entity_rows.append({
            "unified_ent_id": unified_ent_id,
            "company_number": m,
            "company_name": m_rec.get("company_name_clean") or m_rec.get("company_name_raw") or m,
            "post_town": m_rec.get("post_town_clean", ""),
            "postcode": m_rec.get("postcode_clean", ""),
            "is_golden_record": (m == canonical_num),
            "canonical_company_number": canonical_num,
            "canonical_name": canonical_name,
            "cluster_size": len(members),
        })

df_entities = pl.DataFrame(consolidated_entity_rows)
df_golden = pl.DataFrame(golden_record_rows)

df_entities.write_parquet(OUT_ENTITIES_PARQUET, compression="snappy")
df_golden.write_parquet(OUT_GOLDEN_PARQUET, compression="snappy")

print(f"  -> Consolidated entity mappings saved: {OUT_ENTITIES_PARQUET}")
print(f"  -> Golden Records table saved:         {OUT_GOLDEN_PARQUET}")
print(f"  -> Total Golden Entities resolved:     {len(df_golden):,}")

# ---------------------------------------------------------------------------
# Demonstration: Multi-Record Clusters
# ---------------------------------------------------------------------------
print("\n" + "=" * 78)
print("PRODUCTION CLUSTERS & GOLDEN RECORD RESOLUTION (MESSED RECORDS -> UNIFIED ENT_ID)")
print("=" * 78)

sample_clusters = [c for c in golden_record_rows if c["cluster_size"] > 1][:8]
for sc in sample_clusters:
    print(f"\n{sc['unified_ent_id']} (Cluster Size: {sc['cluster_size']})")
    print(f"  ★ GOLDEN RECORD : [{sc['canonical_company_number']}] {sc['canonical_name']}")
    print(f"    Status / Town : {sc['company_status']} | {sc['post_town']} {sc['postcode']}")
    print("    Linked Messy Variants:")
    cluster_records = df_entities.filter(pl.col("unified_ent_id") == sc["unified_ent_id"]).iter_rows(named=True)
    for r in cluster_records:
        mark = "★ [GOLDEN]" if r["is_golden_record"] else "  [MEMBER]"
        print(f"      {mark} {r['company_number']}: {r['company_name']} ({r['post_town']}, {r['postcode']})")

print("=" * 78)

# ---------------------------------------------------------------------------
# Save Metrics & Report
# ---------------------------------------------------------------------------
clustering_metrics = {
    "threshold": THRESHOLD,
    "faiss_prefilter": FAISS_SIM_PREFILTER,
    "total_unique_pairs_evaluated": total_scored,
    "surviving_edges_accepted": accepted_count,
    "discarded_edges_rejected": discarded_count,
    "acceptance_rate_percent": round(accepted_count / total_scored * 100, 2),
    "graph_total_nodes": num_nodes,
    "graph_verified_edges": num_edges,
    "connected_components_total": total_components,
    "multi_record_clusters_count": multi_record_clusters,
    "max_cluster_size": max_cluster_size,
    "sample_golden_entities": [
        {
            "ent_id": sc["unified_ent_id"],
            "canonical_name": sc["canonical_name"],
            "canonical_number": sc["canonical_company_number"],
            "size": sc["cluster_size"],
            "members": sc["cluster_members"],
        }
        for sc in sample_clusters[:5]
    ]
}

with open(OUT_METRICS_PATH, "w", encoding="utf-8") as f:
    json.dump(clustering_metrics, f, indent=2)
print(f"-> Clustering statistics JSON saved: {OUT_METRICS_PATH}")

print("\n" + "=" * 78)
print("PHASE 8 COMPLETE -- GRAPH CLUSTERING & GOLDEN RECORD GENERATION FINISHED")
print("=" * 78)
