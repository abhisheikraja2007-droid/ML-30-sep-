import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
import polars as pl
import torch
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np

print("Testing model download and FAISS...")
device = "cuda" if torch.cuda.is_available() else "cpu"
# Note RTX 5050 sm_120 warning: test if cuda works or fallback to cpu
try:
    model = SentenceTransformer("all-MiniLM-L6-v2", device=device)
    test_out = model.encode(["test company"], convert_to_numpy=True)
    print(f"Loaded model on device: {device}, embedding shape: {test_out.shape}")
except Exception as e:
    print(f"Device {device} failed ({e}), falling back to CPU...")
    device = "cpu"
    model = SentenceTransformer("all-MiniLM-L6-v2", device=device)
    test_out = model.encode(["test company"], convert_to_numpy=True)
    print(f"Loaded model on CPU, embedding shape: {test_out.shape}")

# Test FAISS IndexFlatIP
d = test_out.shape[1]
index = faiss.IndexFlatIP(d)
faiss.normalize_L2(test_out)
index.add(test_out)
print(f"FAISS index built. Total indexed: {index.ntotal}")
D, I = index.search(test_out, 1)
print(f"Search self-match score: {D[0][0]:.4f}")
