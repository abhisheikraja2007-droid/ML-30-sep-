import sys
import os
import time
import torch
import polars as pl
import numpy as np
import faiss  # type: ignore
from sentence_transformers import SentenceTransformer  # type: ignore

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
torch.set_num_threads(16)
device = "cpu"

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
input_parquet = os.path.join(PROJECT_ROOT, "data", "interim", "serialized_companies.parquet")
output_index = os.path.join(PROJECT_ROOT, "data", "interim", "faiss_company_index.bin")

print(f"Building production FAISS index from {input_parquet}...")
t0 = time.time()
df = pl.read_parquet(input_parquet, n_rows=5000)
texts = df['serialized_text'].to_list()
print(f"Encoding {len(texts):,} reference records with all-MiniLM-L6-v2...")

bi_encoder = SentenceTransformer('all-MiniLM-L6-v2', device=device)
embeddings = bi_encoder.encode(
    texts,
    batch_size=128,
    show_progress_bar=True,
    normalize_embeddings=True,
    convert_to_numpy=True
).astype(np.float32)

faiss.normalize_L2(embeddings)
d = embeddings.shape[1]
index = faiss.IndexFlatIP(d)
index.add(embeddings)

faiss.write_index(index, output_index)
print(f"FAISS index with {index.ntotal:,} vectors written to: {output_index}")
print(f"Index built in {time.time() - t0:.2f}s!")
