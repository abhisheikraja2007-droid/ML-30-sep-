import sys
import os
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
import polars as pl

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
csv_path = os.path.join(PROJECT_ROOT, "data", "raw", "BasicCompanyDataAsOneFile-2023-03-01.csv")

with open(csv_path, 'r', encoding='utf-8') as f:
    raw_cols = [c.strip('"') for c in f.readline().strip().split(',')]
col_map = {c: c.strip() for c in raw_cols}

df = pl.read_csv(csv_path, n_rows=25, ignore_errors=True).rename(col_map)
cols = ['CompanyName', 'CompanyNumber', 'RegAddress.AddressLine1', 'RegAddress.PostTown', 'RegAddress.PostCode']
print(df.select(cols))
