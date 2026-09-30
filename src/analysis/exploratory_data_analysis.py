import sys
import os
import json
import time
import polars as pl
import matplotlib.pyplot as plt

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
t0 = time.time()
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
print("Starting dataset analysis pipeline...")

csv_file = os.path.join(PROJECT_ROOT, "data", "raw", "BasicCompanyDataAsOneFile-2023-03-01.csv")

# First, read header to get exact column names and strip whitespace
with open(csv_file, 'r', encoding='utf-8', errors='replace') as f:
    header_line = f.readline().strip()
raw_cols = [c.strip('"') for c in header_line.split(',')]
clean_cols = [c.strip() for c in raw_cols]
col_rename_map = dict(zip(raw_cols, clean_cols))

print(f"Dataset has {len(clean_cols)} columns.")

numeric_candidates = [
    'Mortgages.NumMortCharges', 'Mortgages.NumMortOutstanding',
    'Mortgages.NumMortPartSatisfied', 'Mortgages.NumMortSatisfied',
    'LimitedPartnerships.NumGenPartners', 'LimitedPartnerships.NumLimPartners',
    'Accounts.AccountRefDay', 'Accounts.AccountRefMonth'
]

# Read schema with proper types
schema_overrides = {c: pl.Utf8 for c in raw_cols}
for col in raw_cols:
    if col.strip() in numeric_candidates:
        schema_overrides[col] = pl.Int64

lf = pl.scan_csv(
    csv_file,
    schema_overrides=schema_overrides,
    ignore_errors=True,
    truncate_ragged_lines=True
)

lf = lf.rename(col_rename_map)

print("LazyFrame configured. Executing queries...")

# 1. Total row count
total_rows = lf.select(pl.len()).collect().item()
print(f"Total Rows: {total_rows:,}")

# Let's inspect null / empty rates for all columns
key_cols = [
    'CompanyName', 'CompanyNumber', 'CompanyCategory', 'CompanyStatus',
    'CountryOfOrigin', 'DissolutionDate', 'IncorporationDate',
    'RegAddress.AddressLine1', 'RegAddress.AddressLine2',
    'RegAddress.PostTown', 'RegAddress.County', 'RegAddress.Country', 'RegAddress.PostCode',
    'Accounts.AccountCategory', 'Accounts.LastMadeUpDate', 'Accounts.NextDueDate',
    'Mortgages.NumMortCharges', 'Mortgages.NumMortOutstanding',
    'SICCode.SicText_1', 'SICCode.SicText_2', 'SICCode.SicText_3', 'SICCode.SicText_4',
    'PreviousName_1.CompanyName', 'PreviousName_2.CompanyName',
    'ConfStmtNextDueDate', 'ConfStmtLastMadeUpDate'
]

null_exprs = []
for c in key_cols:
    if c in clean_cols:
        if c in numeric_candidates:
            null_exprs.append(pl.col(c).is_null().sum().alias(c))
        else:
            null_exprs.append((pl.col(c).is_null() | (pl.col(c) == "")).sum().alias(c))

null_df = lf.select(null_exprs).collect()
null_stats = {}
for c in null_df.columns:
    count_missing = null_df[c][0]
    null_stats[c] = {
        "missing_count": int(count_missing),
        "missing_pct": round(float(count_missing) / total_rows * 100, 2)
    }

print("Null statistics calculated.")

# 2. Company Status Distribution
status_df = lf.group_by('CompanyStatus').len().sort('len', descending=True).collect()
status_dist = {str(row['CompanyStatus']): int(row['len']) for row in status_df.to_dicts()}
print("Status distribution calculated.")

# 3. Company Category Distribution
cat_df = lf.group_by('CompanyCategory').len().sort('len', descending=True).collect()
cat_dist = {str(row['CompanyCategory']): int(row['len']) for row in cat_df.to_dicts()}
print("Category distribution calculated.")

# 4. Country of Origin & Registered Country
origin_df = lf.group_by('CountryOfOrigin').len().sort('len', descending=True).limit(15).collect()
origin_dist = {str(row['CountryOfOrigin']): int(row['len']) for row in origin_df.to_dicts()}

country_df = lf.group_by('RegAddress.Country').len().sort('len', descending=True).limit(15).collect()
country_dist = {str(row['RegAddress.Country']): int(row['len']) for row in country_df.to_dicts()}

# 5. Top Post Towns
town_df = lf.filter(pl.col('RegAddress.PostTown').is_not_null() & (pl.col('RegAddress.PostTown') != "")) \
    .group_by('RegAddress.PostTown').len().sort('len', descending=True).limit(20).collect()
town_dist = {str(row['RegAddress.PostTown']): int(row['len']) for row in town_df.to_dicts()}

# 6. Accounts Categories
acc_cat_df = lf.group_by('Accounts.AccountCategory').len().sort('len', descending=True).collect()
acc_cat_dist = {str(row['Accounts.AccountCategory']): int(row['len']) for row in acc_cat_df.to_dicts()}
print("Accounts categories calculated.")

# 7. Top SIC Codes (Primary Industry)
sic1_df = lf.filter(pl.col('SICCode.SicText_1').is_not_null() & (pl.col('SICCode.SicText_1') != "")) \
    .group_by('SICCode.SicText_1').len().sort('len', descending=True).limit(25).collect()
sic1_dist = {str(row['SICCode.SicText_1']): int(row['len']) for row in sic1_df.to_dicts()}

# SIC Code count per company
sic_count_df = lf.select([
    (
        (pl.col('SICCode.SicText_1').is_not_null() & (pl.col('SICCode.SicText_1') != "")).cast(pl.Int32) +
        (pl.col('SICCode.SicText_2').is_not_null() & (pl.col('SICCode.SicText_2') != "")).cast(pl.Int32) +
        (pl.col('SICCode.SicText_3').is_not_null() & (pl.col('SICCode.SicText_3') != "")).cast(pl.Int32) +
        (pl.col('SICCode.SicText_4').is_not_null() & (pl.col('SICCode.SicText_4') != "")).cast(pl.Int32)
    ).alias('num_sic_codes')
]).group_by('num_sic_codes').len().sort('num_sic_codes').collect()
sic_counts = {int(row['num_sic_codes']): int(row['len']) for row in sic_count_df.to_dicts()}

# 8. Mortgages & Debt
mort_summary = lf.select([
    (pl.col('Mortgages.NumMortCharges') > 0).sum().alias('has_mortgages'),
    (pl.col('Mortgages.NumMortOutstanding') > 0).sum().alias('has_outstanding'),
    pl.col('Mortgages.NumMortCharges').mean().alias('avg_charges'),
    pl.col('Mortgages.NumMortCharges').max().alias('max_charges'),
    pl.col('Mortgages.NumMortOutstanding').mean().alias('avg_outstanding'),
    pl.col('Mortgages.NumMortOutstanding').max().alias('max_outstanding'),
    pl.col('Mortgages.NumMortSatisfied').sum().alias('total_satisfied')
]).collect().to_dicts()[0]

# 9. Name changes frequency
name_change_summary = lf.select([
    (pl.col('PreviousName_1.CompanyName').is_not_null() & (pl.col('PreviousName_1.CompanyName') != "")).sum().alias('changed_1_plus'),
    (pl.col('PreviousName_2.CompanyName').is_not_null() & (pl.col('PreviousName_2.CompanyName') != "")).sum().alias('changed_2_plus'),
    (pl.col('PreviousName_3.CompanyName').is_not_null() & (pl.col('PreviousName_3.CompanyName') != "")).sum().alias('changed_3_plus'),
    (pl.col('PreviousName_4.CompanyName').is_not_null() & (pl.col('PreviousName_4.CompanyName') != "")).sum().alias('changed_4_plus'),
    (pl.col('PreviousName_5.CompanyName').is_not_null() & (pl.col('PreviousName_5.CompanyName') != "")).sum().alias('changed_5_plus'),
]).collect().to_dicts()[0]

# 10. Incorporation year breakdown
incorp_year_df = lf.filter(pl.col('IncorporationDate').is_not_null() & (pl.col('IncorporationDate').str.len_bytes() >= 10)) \
    .select([
        pl.col('IncorporationDate').str.slice(-4, 4).alias('IncorpYear')
    ]) \
    .filter(pl.col('IncorpYear').str.contains('^[12][0-9]{3}$')) \
    .group_by('IncorpYear').len().sort('IncorpYear').collect()
incorp_years = {str(row['IncorpYear']): int(row['len']) for row in incorp_year_df.to_dicts()}

# 11. Top registered addresses (Potential company creation hubs / formation agents)
top_addresses = lf.filter(
    pl.col('RegAddress.AddressLine1').is_not_null() & (pl.col('RegAddress.AddressLine1') != "") &
    pl.col('RegAddress.PostTown').is_not_null() & pl.col('RegAddress.PostCode').is_not_null()
).select([
    (pl.col('RegAddress.AddressLine1') + ', ' + pl.col('RegAddress.PostTown') + ', ' + pl.col('RegAddress.PostCode')).alias('full_address')
]).group_by('full_address').len().sort('len', descending=True).limit(15).collect()
top_address_dist = {str(row['full_address']): int(row['len']) for row in top_addresses.to_dicts()}

# 12. Oldest active companies
oldest_companies = lf.filter(
    (pl.col('CompanyStatus') == 'Active') & 
    pl.col('IncorporationDate').is_not_null() & 
    (pl.col('IncorporationDate').str.len_bytes() >= 10)
).select(['CompanyNumber', 'CompanyName', 'CompanyCategory', 'IncorporationDate']) \
.with_columns(pl.col('IncorporationDate').str.slice(-4, 4).alias('IncorpYear')) \
.filter(pl.col('IncorpYear').str.contains('^18[0-9]{2}$')) \
.sort('IncorpYear') \
.limit(10).collect().to_dicts()

# Combine all results
results = {
    "total_rows": total_rows,
    "execution_time_seconds": round(time.time() - t0, 2),
    "null_stats": null_stats,
    "status_distribution": status_dist,
    "category_distribution": cat_dist,
    "country_of_origin": origin_dist,
    "registered_country": country_dist,
    "top_post_towns": town_dist,
    "accounts_categories": acc_cat_dist,
    "top_sic_codes": sic1_dist,
    "sic_code_counts": sic_counts,
    "mortgage_summary": mort_summary,
    "name_change_summary": name_change_summary,
    "incorporation_years": incorp_years,
    "top_addresses": top_address_dist,
    "oldest_companies": oldest_companies
}

output_path = os.path.join(PROJECT_ROOT, "reports", "metrics", "dataset_analysis_results.json")
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(results, f, indent=2, ensure_ascii=False)

print(f"Analysis successfully completed in {round(time.time() - t0, 2)}s and saved to {output_path}!")

# Let's generate summary charts
chart_dir = os.path.join(PROJECT_ROOT, "reports", "figures")
os.makedirs(chart_dir, exist_ok=True)

# Chart 1: Company Status breakdown (Top 6 + Others)
plt.style.use('seaborn-v0_8-whitegrid' if 'seaborn-v0_8-whitegrid' in plt.style.available else 'default')
fig, ax = plt.subplots(figsize=(10, 5))
top_statuses = list(status_dist.items())[:6]
labels = [k for k, v in top_statuses]
values = [v for k, v in top_statuses]
ax.barh(labels[::-1], [v/1000 for v in values[::-1]], color='#2b5c8f')
ax.set_xlabel('Count (in Thousands)')
ax.set_title('Company Status Breakdown (Companies House 2023)', fontsize=14, fontweight='bold')
for i, v in enumerate(values[::-1]):
    ax.text(v/1000 + 10, i, f"{v:,} ({v/total_rows*100:.1f}%)", va='center', fontsize=9)
plt.tight_layout()
plt.savefig(f"{chart_dir}/status_breakdown.png", dpi=200)
plt.close()

# Chart 2: Annual Incorporations (1980 - 2022)
years = sorted([int(y) for y in incorp_years.keys() if 1980 <= int(y) <= 2022])
y_counts = [incorp_years[str(y)] for y in years]
fig, ax = plt.subplots(figsize=(12, 5))
ax.plot(years, [c/1000 for c in y_counts], marker='o', markersize=3, color='#0284c7', linewidth=2)
ax.fill_between(years, [c/1000 for c in y_counts], color='#0284c7', alpha=0.15)
ax.set_xlabel('Incorporation Year', fontsize=11)
ax.set_ylabel('New Incorporations (Thousands)', fontsize=11)
ax.set_title('UK Company Formations per Year (1980 - 2022)', fontsize=14, fontweight='bold')
plt.tight_layout()
plt.savefig(f"{chart_dir}/incorporation_trend.png", dpi=200)
plt.close()

# Chart 3: Top 10 Primary Industries (SIC Codes)
fig, ax = plt.subplots(figsize=(11, 6))
top_sic = list(sic1_dist.items())[:10]
sic_labels = [k[:40] + ('...' if len(k) > 40 else '') for k, v in top_sic]
sic_vals = [v for k, v in top_sic]
ax.barh(sic_labels[::-1], [v/1000 for v in sic_vals[::-1]], color='#0d9488')
ax.set_xlabel('Count (Thousands)', fontsize=11)
ax.set_title('Top 10 Primary Economic Sectors (SIC Codes)', fontsize=14, fontweight='bold')
for i, v in enumerate(sic_vals[::-1]):
    ax.text(v/1000 + 2, i, f"{v:,}", va='center', fontsize=9)
plt.tight_layout()
plt.savefig(f"{chart_dir}/top_industries.png", dpi=200)
plt.close()

# Chart 4: Top 10 Post Towns
fig, ax = plt.subplots(figsize=(10, 5))
top_towns = list(town_dist.items())[:10]
town_labels = [k for k, v in top_towns]
town_vals = [v for k, v in top_towns]
ax.barh(town_labels[::-1], [v/1000 for v in town_vals[::-1]], color='#6366f1')
ax.set_xlabel('Companies Registered (Thousands)', fontsize=11)
ax.set_title('Top 10 UK Cities / Post Towns by Business Registration', fontsize=14, fontweight='bold')
for i, v in enumerate(town_vals[::-1]):
    ax.text(v/1000 + 5, i, f"{v:,} ({v/total_rows*100:.1f}%)", va='center', fontsize=9)
plt.tight_layout()
plt.savefig(f"{chart_dir}/top_towns.png", dpi=200)
plt.close()

print("Charts successfully generated in charts/ directory!")
