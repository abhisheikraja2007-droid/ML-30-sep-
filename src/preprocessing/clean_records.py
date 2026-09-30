import sys
import os
import time
import polars as pl

# Ensure UTF-8 output for Windows console
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

print("=" * 70)
print("PHASE 1: DATA PREPROCESSING & CLEANING PIPELINE")
print("Vectorized Multi-threaded Lazy Processing with Polars")
print("=" * 70)

t_start = time.time()
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
raw_csv_path = os.path.join(PROJECT_ROOT, "data", "raw", "BasicCompanyDataAsOneFile-2023-03-01.csv")
output_parquet_path = os.path.join(PROJECT_ROOT, "data", "interim", "preprocessed_companies.parquet")
sample_csv_path = os.path.join(PROJECT_ROOT, "data", "processed", "preprocessed_sample_100k.csv")

# Step 1: Read raw header to sanitize column names (handling leading/trailing spaces)
with open(raw_csv_path, 'r', encoding='utf-8', errors='replace') as f:
    raw_header = f.readline().strip()
raw_columns = [c.strip('"') for c in raw_header.split(',')]
clean_columns = [c.strip() for c in raw_columns]
rename_map = dict(zip(raw_columns, clean_columns))

print(f"[1/5] Header sanitized: {len(clean_columns)} columns mapped.")

# Configure schema overrides: read all string/text columns as Utf8
schema_overrides = {col: pl.Utf8 for col in raw_columns}

# Step 2: Initialize Polars LazyFrame
print("[2/5] Initializing Polars LazyFrame (non-blocking query plan)...")
lf = pl.scan_csv(
    raw_csv_path,
    schema_overrides=schema_overrides,
    ignore_errors=True,
    truncate_ragged_lines=True
).rename(rename_map)

# Step 3: Vectorized Imputation & Text Normalization across ALL string columns
print("[3/5] Building vectorized transformation tree...")

# Regex pattern for corporate boilerplate:
# Matches 'ltd', 'limited', 'plc' as independent words (case-insensitive boundary)
# followed optionally by period or punctuation
boilerplate_pattern = r"(?i)\b(ltd|limited|plc)\b\.?"

# Imputation (null -> "") and Normalization (lowercase) across all text columns
string_cols = [c for c in clean_columns if c in lf.collect_schema().names()]

impute_and_lowercase_exprs = [
    pl.col(c).fill_null("").str.to_lowercase().alias(c)
    for c in string_cols
]
lf = lf.with_columns(impute_and_lowercase_exprs)

# Step 4: Specialized Standardization & Address Parsing
# A. Company Name Standardization:
#    - Strip boilerplate (ltd, limited, plc)
#    - Clean punctuation artifacts (quotes, brackets, exclamations, commas, periods)
#    - Collapse redundant internal whitespace
#    - Trim boundaries
#    - Fallback to lowercased raw name if stripping emptied the string
clean_name_expr = (
    pl.col('CompanyName')
    .str.replace_all(boilerplate_pattern, "")
    .str.replace_all(r"[\\.,'\"!?:;()\[\]{}*&^%$#@~`\\/|_-]", " ")
    .str.replace_all(r"\s+", " ")
    .str.strip_chars()
)

# B. Address Parsing:
#    - Isolate and sanitize Post Town
#    - Isolate and sanitize Postcode
#    - Extract outward code (postcode_area) for spatial clustering / blocking
clean_town_expr = (
    pl.col('RegAddress.PostTown')
    .str.replace_all(r"[\\.,'\"!?:;()\[\]{}*&^%$#@~`\\/|_-]", " ")
    .str.replace_all(r"\s+", " ")
    .str.strip_chars()
)

clean_postcode_expr = (
    pl.col('RegAddress.PostCode')
    .str.replace_all(r"[\\.,'\"!?:;()\[\]{}*&^%$#@~`\\/|_-]", " ")
    .str.replace_all(r"\s+", " ")
    .str.strip_chars()
)

postcode_area_expr = (
    pl.col('RegAddress.PostCode')
    .str.extract(r"^([a-z0-9]+)\s*", 1)
    .fill_null("")
)

# Apply standardized columns
lf = lf.with_columns([
    clean_name_expr.alias('company_name_clean'),
    clean_town_expr.alias('post_town_clean'),
    clean_postcode_expr.alias('postcode_clean'),
    postcode_area_expr.alias('postcode_area')
])

# Ensure company_name_clean is not blank; if blank fallback to stripped raw CompanyName
lf = lf.with_columns(
    pl.when(pl.col('company_name_clean') == "")
      .then(pl.col('CompanyName').str.strip_chars())
      .otherwise(pl.col('company_name_clean'))
      .alias('company_name_clean')
)

# C. Unified Matching String Feature:
# Combine sanitized name, post town, and postcode into a single compact feature vector string
lf = lf.with_columns(
    (
        pl.col('company_name_clean') + " " +
        pl.col('post_town_clean') + " " +
        pl.col('postcode_clean')
    ).str.replace_all(r"\s+", " ").str.strip_chars().alias('matching_feature_text')
)

# Select key model-ready features while retaining core metadata
model_features_lf = lf.select([
    pl.col('CompanyNumber').alias('company_number'),
    pl.col('CompanyName').alias('company_name_raw'),
    pl.col('company_name_clean'),
    pl.col('post_town_clean'),
    pl.col('postcode_clean'),
    pl.col('postcode_area'),
    pl.col('matching_feature_text'),
    pl.col('RegAddress.AddressLine1').alias('address_line1'),
    pl.col('RegAddress.AddressLine2').alias('address_line2'),
    pl.col('RegAddress.County').alias('county'),
    pl.col('RegAddress.Country').alias('country'),
    pl.col('CompanyCategory').alias('company_category'),
    pl.col('CompanyStatus').alias('company_status'),
    pl.col('CountryOfOrigin').alias('country_of_origin'),
    pl.col('IncorporationDate').alias('incorporation_date'),
    pl.col('SICCode.SicText_1').alias('primary_sic_text'),
    pl.col('Accounts.AccountCategory').alias('accounts_category'),
    pl.col('Mortgages.NumMortCharges').alias('num_mort_charges'),
    pl.col('Mortgages.NumMortOutstanding').alias('num_mort_outstanding'),
])

print("[4/5] Executing multi-core streaming computation to Parquet...")
# Sink to Parquet: streaming execution keeps memory footprint minimal
model_features_lf.sink_parquet(
    output_parquet_path,
    compression="snappy"
)
elapsed = time.time() - t_start
parquet_size = os.path.getsize(output_parquet_path) / (1024 * 1024)

print(f"-> Successfully written full preprocessed dataset to: {output_parquet_path}")
print(f"-> File size: {parquet_size:.2f} MB (Compressed from 2,582 MB raw CSV, ~{2582/parquet_size:.1f}x compression!)")
print(f"-> Total elapsed execution time: {elapsed:.2f} seconds")

# Step 5: Save a representative 100k sample for fast local inspection
print("[5/5] Generating 100,000 row CSV sample for fast inspection...")
sample_df = pl.read_parquet(output_parquet_path, n_rows=100_000)
sample_df.write_csv(sample_csv_path)
sample_size = os.path.getsize(sample_csv_path) / (1024 * 1024)
print(f"-> Sample saved to: {sample_csv_path} ({sample_size:.2f} MB)")

# Verification: inspect sample rows
print("\n" + "=" * 70)
print("PREPROCESSING VALIDATION & AUDIT SAMPLE (First 10 Rows)")
print("=" * 70)
display_sample = sample_df.select([
    'company_number', 'company_name_raw', 'company_name_clean',
    'post_town_clean', 'postcode_clean', 'postcode_area', 'matching_feature_text'
]).head(10)

for row in display_sample.iter_rows(named=True):
    print(f"[{row['company_number']}]")
    print(f"  Raw Name  : '{row['company_name_raw']}'")
    print(f"  Clean Name: '{row['company_name_clean']}'")
    print(f"  Address   : Town='{row['post_town_clean']}', Postcode='{row['postcode_clean']}', Area='{row['postcode_area']}'")
    print(f"  Feature   : '{row['matching_feature_text']}'")
    print("-" * 50)

print(f"\nAll operations completed successfully in {time.time() - t_start:.2f}s.")
