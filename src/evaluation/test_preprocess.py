import sys
import os
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
import polars as pl
import re

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
csv_path = os.path.join(PROJECT_ROOT, "data", "raw", "BasicCompanyDataAsOneFile-2023-03-01.csv")

with open(csv_path, 'r', encoding='utf-8') as f:
    raw_cols = [c.strip('"') for c in f.readline().strip().split(',')]
col_map = {c: c.strip() for c in raw_cols}

df_sample = pl.read_csv(csv_path, n_rows=50, ignore_errors=True).rename(col_map)

# Test standardization
test_df = df_sample.select([
    pl.col('CompanyName'),
    pl.col('CompanyNumber'),
    pl.col('RegAddress.AddressLine1'),
    pl.col('RegAddress.PostTown'),
    pl.col('RegAddress.PostCode')
])

# 1. Fill null with ""
test_df = test_df.with_columns(pl.col(pl.Utf8).fill_null(""))

# 2. Lowercase all text
test_df = test_df.with_columns(pl.col(pl.Utf8).str.to_lowercase())

# 3. Standardization: remove ltd, limited, plc boilerplate
# Using regex word boundary
pattern = r"\b(ltd|limited|plc)\b\.?"
test_df = test_df.with_columns([
    pl.col('CompanyName')
        .str.replace_all(pattern, "")
        .str.replace_all(r"[\.,'\"!]", " ") # Clean common punctuation noise
        .str.replace_all(r"\s+", " ")       # Collapse whitespace
        .str.strip_chars()                  # Trim whitespace
        .alias('company_name_clean'),

    # Address parsing: clean post town
    pl.col('RegAddress.PostTown')
        .str.replace_all(r"[\.,'\"!]", "")
        .str.replace_all(r"\s+", " ")
        .str.strip_chars()
        .alias('post_town_clean'),

    # Clean postcode
    pl.col('RegAddress.PostCode')
        .str.replace_all(r"\s+", " ")
        .str.strip_chars()
        .alias('postcode_clean'),

    # Postcode outward code (area) for spatial blocking
    pl.col('RegAddress.PostCode')
        .str.extract(r"^([a-z0-9]+)\s*", 1)
        .fill_null("")
        .alias('postcode_area')
])

for row in test_df.select(['CompanyName', 'company_name_clean', 'post_town_clean', 'postcode_clean', 'postcode_area']).head(15).iter_rows(named=True):
    print(f"Raw: {row['CompanyName']} -> Clean: '{row['company_name_clean']}' | Town: '{row['post_town_clean']}' | Postcode: '{row['postcode_clean']}' (Area: '{row['postcode_area']}')")
