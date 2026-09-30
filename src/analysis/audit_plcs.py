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

lf = pl.scan_csv(csv_path, ignore_errors=True).rename(col_map)
plcs = lf.filter(pl.col('CompanyCategory') == 'Public Limited Company').select(['CompanyName', 'CompanyNumber', 'CompanyStatus', 'IncorporationDate']).limit(5).collect()
print('Sample PLCs:\n', plcs)

oldest = lf.filter((pl.col('CompanyStatus') == 'Active') & (pl.col('IncorporationDate').str.len_bytes() >= 10)) \
    .with_columns(pl.col('IncorporationDate').str.slice(-4, 4).alias('Year')) \
    .filter(pl.col('Year').str.contains('^18[0-9]{2}$')) \
    .sort('Year') \
    .select(['CompanyNumber', 'CompanyName', 'Year', 'Accounts.AccountCategory']) \
    .limit(8).collect()
print('\nOldest Active:\n', oldest)

plc_count = lf.filter(pl.col('CompanyCategory') == 'Public Limited Company').select(pl.len()).collect().item()
print('Total PLCs:', plc_count)
