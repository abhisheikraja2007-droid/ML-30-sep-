import sys
import os
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
import polars as pl
from datetime import datetime

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
csv_path = os.path.join(PROJECT_ROOT, "data", "raw", "BasicCompanyDataAsOneFile-2023-03-01.csv")

with open(csv_path, 'r', encoding='utf-8') as f:
    raw_cols = [c.strip('"') for c in f.readline().strip().split(',')]
col_map = {c: c.strip() for c in raw_cols}

lf = pl.scan_csv(csv_path, ignore_errors=True).rename(col_map)

# Filter for active companies
active = lf.filter(pl.col('CompanyStatus') == 'Active')
total_active = active.select(pl.len()).collect().item()

# Accounts.NextDueDate is DD/MM/YYYY
# Let's count overdue vs on-time for Active companies where date is present
overdue_accounts = active.filter(
    pl.col('Accounts.NextDueDate').is_not_null() & 
    (pl.col('Accounts.NextDueDate').str.len_bytes() == 10)
).select([
    (
        pl.col('Accounts.NextDueDate').str.slice(6, 4) + '-' +
        pl.col('Accounts.NextDueDate').str.slice(3, 2) + '-' +
        pl.col('Accounts.NextDueDate').str.slice(0, 2)
    ).alias('due_iso')
]).filter(pl.col('due_iso') < '2023-03-01').select(pl.len()).collect().item()

# Confirmation Statement overdue
overdue_conf = active.filter(
    pl.col('ConfStmtNextDueDate').is_not_null() & 
    (pl.col('ConfStmtNextDueDate').str.len_bytes() == 10)
).select([
    (
        pl.col('ConfStmtNextDueDate').str.slice(6, 4) + '-' +
        pl.col('ConfStmtNextDueDate').str.slice(3, 2) + '-' +
        pl.col('ConfStmtNextDueDate').str.slice(0, 2)
    ).alias('conf_due_iso')
]).filter(pl.col('conf_due_iso') < '2023-03-01').select(pl.len()).collect().item()

print(f"Total Active: {total_active:,}")
print(f"Active with Overdue Accounts: {overdue_accounts:,} ({overdue_accounts/total_active*100:.2f}%)")
print(f"Active with Overdue Confirmation Statement: {overdue_conf:,} ({overdue_conf/total_active*100:.2f}%)")
