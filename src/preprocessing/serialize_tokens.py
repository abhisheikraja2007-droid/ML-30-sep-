import sys
import os
import time
import polars as pl

# Ensure UTF-8 output
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

print("=" * 70)
print("PHASE 2: SERIALIZATION (STRINGIFICATION) PIPELINE")
print("Feature Representation for Language Models & Transformers")
print("=" * 70)

t_start = time.time()
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
input_parquet = os.path.join(PROJECT_ROOT, "data", "interim", "preprocessed_companies.parquet")
output_parquet = os.path.join(PROJECT_ROOT, "data", "interim", "serialized_companies.parquet")
sample_csv = os.path.join(PROJECT_ROOT, "data", "processed", "serialized_sample_100k.csv")
preview_txt = os.path.join(PROJECT_ROOT, "data", "interim", "serialized_preview.txt")

print(f"[1/4] Loading preprocessed dataset: {input_parquet}...")
lf = pl.scan_parquet(input_parquet)

# Define vectorized stringification expressions
print("[2/4] Vectorizing stringification transformation graph...")

# Standard Serialization (Full Identity: Name + Street Address + Town + Zip + Type)
# Handles missing address components gracefully without generating orphaned tokens
serialized_full_expr = (
    pl.lit("[NAME] ") + pl.col('company_name_clean') +
    pl.when(pl.col('address_line1') != "")
      .then(pl.lit(" [ADDR] ") + pl.col('address_line1'))
      .otherwise(pl.lit("")) +
    pl.when(pl.col('post_town_clean') != "")
      .then(pl.lit(" [TOWN] ") + pl.col('post_town_clean'))
      .otherwise(pl.lit("")) +
    pl.when(pl.col('postcode_clean') != "")
      .then(pl.lit(" [ZIP] ") + pl.col('postcode_clean'))
      .otherwise(pl.lit("")) +
    pl.when(pl.col('company_category') != "")
      .then(pl.lit(" [TYPE] ") + pl.col('company_category'))
      .otherwise(pl.lit(""))
).str.replace_all(r"\s+", " ").str.strip_chars()

# Compact Serialization (Name + Town + Zip + Type - exact match to user prompt example)
serialized_compact_expr = (
    pl.lit("[NAME] ") + pl.col('company_name_clean') +
    pl.when(pl.col('post_town_clean') != "")
      .then(pl.lit(" [TOWN] ") + pl.col('post_town_clean'))
      .otherwise(pl.lit("")) +
    pl.when(pl.col('postcode_clean') != "")
      .then(pl.lit(" [ZIP] ") + pl.col('postcode_clean'))
      .otherwise(pl.lit("")) +
    pl.when(pl.col('company_category') != "")
      .then(pl.lit(" [TYPE] ") + pl.col('company_category'))
      .otherwise(pl.lit(""))
).str.replace_all(r"\s+", " ").str.strip_chars()

# Apply serialized expressions and compute sequence metrics (char length and word count)
lf_serialized = lf.with_columns([
    serialized_full_expr.alias('serialized_text'),
    serialized_compact_expr.alias('serialized_compact'),
]).with_columns([
    pl.col('serialized_text').str.len_chars().alias('char_length'),
    pl.col('serialized_text').str.split(" ").list.len().alias('token_word_count')
])

print("[3/4] Streaming 5.29M serialized records to Parquet...")
# Select key output fields
output_lf = lf_serialized.select([
    'company_number',
    'serialized_text',
    'serialized_compact',
    'char_length',
    'token_word_count',
    'company_name_clean',
    'post_town_clean',
    'postcode_clean',
    'company_category',
    'company_status',
    'primary_sic_text'
])

output_lf.sink_parquet(
    output_parquet,
    compression="snappy"
)

elapsed = time.time() - t_start
parquet_size = os.path.getsize(output_parquet) / (1024 * 1024)
print(f"-> Serialized Parquet written to: {output_parquet}")
print(f"-> Size: {parquet_size:.2f} MB | Runtime: {elapsed:.2f} seconds")

# Step 4: Token Length & Sequence Statistics across the entire 5.29M rows
print("[4/4] Computing sequence length analytics for Transformer tokenizers...")
stats_df = pl.scan_parquet(output_parquet).select([
    pl.col('char_length').mean().alias('avg_chars'),
    pl.col('char_length').median().alias('median_chars'),
    pl.col('char_length').min().alias('min_chars'),
    pl.col('char_length').max().alias('max_chars'),
    pl.col('token_word_count').mean().alias('avg_words'),
    pl.col('token_word_count').median().alias('median_words'),
    pl.col('token_word_count').quantile(0.95).alias('p95_words'),
    pl.col('token_word_count').quantile(0.99).alias('p99_words'),
    pl.col('token_word_count').max().alias('max_words'),
    (pl.col('token_word_count') <= 32).sum().alias('under_32_words'),
    (pl.col('token_word_count') <= 64).sum().alias('under_64_words'),
    (pl.col('token_word_count') <= 128).sum().alias('under_128_words'),
    pl.len().alias('total_records')
]).collect()

stats = stats_df.to_dicts()[0]
total = stats['total_records']

print("\n" + "=" * 70)
print("SEQUENCE & TOKENIZATION BENCHMARKS")
print("=" * 70)
print(f"Total Rows Serialized   : {total:,}")
print(f"Average Character Length: {stats['avg_chars']:.1f} chars (Median: {stats['median_chars']:.0f})")
print(f"Average Word Count      : {stats['avg_words']:.1f} words (Median: {stats['median_words']:.0f})")
print(f"95th Percentile Words   : {stats['p95_words']:.0f} words")
print(f"99th Percentile Words   : {stats['p99_words']:.0f} words")
print(f"Max Words in Sequence   : {stats['max_words']}")
print(f"Fits within 32 tokens   : {stats['under_32_words']:,} ({stats['under_32_words']/total*100:.2f}%)")
print(f"Fits within 64 tokens   : {stats['under_64_words']:,} ({stats['under_64_words']/total*100:.2f}%)")
print(f"Fits within 128 tokens  : {stats['under_128_words']:,} ({stats['under_128_words']/total*100:.2f}%)")

# Export 100k sample CSV and text preview
print("\nExporting sample files for inspection...")
sample_df = pl.read_parquet(output_parquet, n_rows=100_000)
sample_df.write_csv(sample_csv)

with open(preview_txt, 'w', encoding='utf-8') as f:
    f.write("PHASE 2 SERIALIZED EXAMPLES (First 50 Entities)\n")
    f.write("=" * 80 + "\n\n")
    for row in sample_df.head(50).iter_rows(named=True):
        f.write(f"Company ID : {row['company_number']}\n")
        f.write(f"Format 1 (Full)   : {row['serialized_text']}\n")
        f.write(f"Format 2 (Compact): {row['serialized_compact']}\n")
        f.write(f"Tokens: {row['token_word_count']} words | Chars: {row['char_length']}\n")
        f.write("-" * 80 + "\n")

print(f"-> Sample CSV: {sample_csv}")
print(f"-> Text Preview: {preview_txt}")

print("\n" + "=" * 70)
print("FIRST 5 SERIALIZED SEQUENCES READY FOR LANGUAGE MODEL ENCODER:")
print("=" * 70)
for row in sample_df.head(5).iter_rows(named=True):
    print(f"[{row['company_number']}]")
    print(f"  {row['serialized_text']}")
    print()

print(f"Pipeline executed in {time.time() - t_start:.2f}s.")
