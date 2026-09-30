"""
Phase 6: Advanced Feature Engineering (Character & Null Indicators)
====================================================================
For every FAISS candidate pair (from val_pairs / train_pairs):

  Step 1  Parse serialized text into individual field tokens
          (name, address, town, postcode)
  Step 2  Compute deterministic character-level similarity features:
            name_jaro_winkler      Jaro-Winkler on CompanyName (prefix-rewarding)
            name_levenshtein_norm  Normalized Levenshtein on CompanyName
            name_exact             Boolean exact match on name
            town_jaro_winkler      Jaro-Winkler on PostTown
            postcode_exact         Boolean exact match on PostCode
            postcode_jaro          Jaro on PostCode (partial prefix matches)
            address_jaro           Jaro-Winkler on address line
  Step 3  Generate null / missing-value indicator features:
            is_address_missing_a   1 if address A is blank
            is_address_missing_b   1 if address B is blank
            is_town_missing_a      1 if town A is blank
            is_town_missing_b      1 if town B is blank
            is_postcode_missing_a  1 if postcode A is blank
            is_postcode_missing_b  1 if postcode B is blank
            both_address_missing   1 if both sides have no address
            both_postcode_missing  1 if both sides have no postcode
  Step 4  Score every pair with the fine-tuned Cross-Encoder (Phase 5)
  Step 5  Assemble ensemble dataset and export to parquet + JSON stats

Output column layout per pair:
  [cross_encoder_score, name_jaro_winkler, name_levenshtein_norm, name_exact,
   town_jaro_winkler, postcode_exact, postcode_jaro, address_jaro,
   is_address_missing_a, is_address_missing_b, is_town_missing_a,
   is_town_missing_b, is_postcode_missing_a, is_postcode_missing_b,
   both_address_missing, both_postcode_missing, faiss_similarity*, label]
  (* carried through from Phase 3/4 where available)
"""

import sys
import os
import re
import time
import json

import numpy as np
import polars as pl
from tqdm import tqdm

# ---------------------------------------------------------------------------
# Gracefully handle optional heavy imports
# ---------------------------------------------------------------------------
try:
    import jellyfish                                   # pip install jellyfish
    HAS_JELLYFISH = True
except ImportError:
    HAS_JELLYFISH = False
    print("[WARNING] jellyfish not installed -- falling back to pure-Python Jaro-Winkler.")
    print("          Install with:  pip install jellyfish")

try:
    from sentence_transformers import CrossEncoder     # type: ignore
    HAS_CE = True
except ImportError:
    HAS_CE = False
    print("[WARNING] sentence-transformers not found -- Cross-Encoder scoring skipped.")

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
ALL_PAIRS    = os.path.join(PROJECT_ROOT, "data", "processed", "training_pairs.parquet")
VAL_PAIRS    = os.path.join(PROJECT_ROOT, "data", "processed", "val_pairs.parquet")
MODEL_DIR    = os.path.join(PROJECT_ROOT, "models", "fine_tuned_cross_encoder")
OUT_ENSEMBLE = os.path.join(PROJECT_ROOT, "data", "processed", "ensemble_features.parquet")
OUT_METRICS  = os.path.join(PROJECT_ROOT, "reports", "metrics", "phase6_feature_stats.json")

os.makedirs(os.path.join(PROJECT_ROOT, "reports", "metrics"), exist_ok=True)


# ===========================================================================
# SECTION 1 -- SERIALIZED TEXT PARSER
# ===========================================================================
# Token format produced by Phase 2 (serialize_tokens.py):
#   [NAME] company_name [ADDR] address_line [TOWN] post_town [ZIP] postcode

_NAME_RE = re.compile(r"\[NAME\](.*?)(?:\[ADDR\]|\[TOWN\]|\[ZIP\]|$)", re.DOTALL)
_ADDR_RE = re.compile(r"\[ADDR\](.*?)(?:\[TOWN\]|\[ZIP\]|$)",           re.DOTALL)
_TOWN_RE = re.compile(r"\[TOWN\](.*?)(?:\[ZIP\]|$)",                     re.DOTALL)
_ZIP_RE  = re.compile(r"\[ZIP\](.*?)$",                                   re.DOTALL)


def parse_serialized(text: str) -> dict:
    """
    Extracts individual fields from the Phase-2 serialized token string.
    Returns dict with keys: 'name', 'address', 'town', 'postcode'
    (all lowercase-stripped; empty string when field is absent).
    """
    t = str(text or "")

    def _get(pattern: re.Pattern) -> str:
        m = pattern.search(t)
        return m.group(1).strip() if m else ""

    return {
        "name":     _get(_NAME_RE),
        "address":  _get(_ADDR_RE),
        "town":     _get(_TOWN_RE),
        "postcode": _get(_ZIP_RE),
    }


# ===========================================================================
# SECTION 2 -- CHARACTER-LEVEL SIMILARITY FUNCTIONS
# ===========================================================================

def _jaro_winkler(a: str, b: str) -> float:
    """Jaro-Winkler similarity in [0, 1].  Rewards matching prefixes."""
    if not a and not b:
        return 1.0
    if not a or not b:
        return 0.0
    if HAS_JELLYFISH:
        return float(jellyfish.jaro_winkler_similarity(a, b))
    return _jaro_pure(a, b)                             # pure-Python fallback


def _jaro_pure(s1: str, s2: str) -> float:
    """Pure-Python Jaro similarity (fallback when jellyfish is unavailable)."""
    if s1 == s2:
        return 1.0
    l1, l2 = len(s1), len(s2)
    if l1 == 0 or l2 == 0:
        return 0.0
    match_dist  = max(l1, l2) // 2 - 1
    s1_matches  = [False] * l1
    s2_matches  = [False] * l2
    matches     = 0
    transpositions = 0

    for i in range(l1):
        start = max(0, i - match_dist)
        end   = min(i + match_dist + 1, l2)
        for j in range(start, end):
            if s2_matches[j] or s1[i] != s2[j]:
                continue
            s1_matches[i] = s2_matches[j] = True
            matches += 1
            break

    if matches == 0:
        return 0.0

    k = 0
    for i in range(l1):
        if not s1_matches[i]:
            continue
        while not s2_matches[k]:
            k += 1
        if s1[i] != s2[k]:
            transpositions += 1
        k += 1

    return (matches / l1 + matches / l2 +
            (matches - transpositions / 2) / matches) / 3


def _levenshtein_norm(a: str, b: str) -> float:
    """
    Normalized Levenshtein similarity in [0, 1].
    Formula: 1 - edit_distance / max(len(a), len(b))
    """
    if not a and not b:
        return 1.0
    if not a or not b:
        return 0.0

    if HAS_JELLYFISH:
        dist = jellyfish.levenshtein_distance(a, b)
    else:
        la, lb = len(a), len(b)
        dp = list(range(lb + 1))
        for i in range(1, la + 1):
            prev = dp[:]
            dp[0] = i
            for j in range(1, lb + 1):
                cost = 0 if a[i - 1] == b[j - 1] else 1
                dp[j] = min(dp[j] + 1, dp[j - 1] + 1, prev[j - 1] + cost)
        dist = dp[lb]

    return 1.0 - dist / max(len(a), len(b))


def _exact(a: str, b: str) -> int:
    """1 if both non-empty and identical, else 0."""
    return int(bool(a) and bool(b) and a == b)


# ===========================================================================
# SECTION 3 -- PER-PAIR FEATURE VECTOR
# ===========================================================================

def compute_pair_features(text_a: str, text_b: str) -> dict:
    """
    Given two Phase-2 serialized company strings, compute all
    character-level similarity features and null-indicator flags.

    Example output for the pair described in the task spec:
      {
        "cross_encoder_score": 0.88,  <- added later in Section 5
        "name_jaro_winkler":   0.96,
        "postcode_exact":      1,
        "is_address_missing_a": 1,
        ...
      }
    """
    a = parse_serialized(text_a)
    b = parse_serialized(text_b)

    # -- Similarity features ------------------------------------------------
    name_jw    = _jaro_winkler(a["name"],     b["name"])
    name_lev   = _levenshtein_norm(a["name"], b["name"])
    name_exact = _exact(a["name"],            b["name"])
    town_jw    = _jaro_winkler(a["town"],     b["town"])
    pc_exact   = _exact(a["postcode"],        b["postcode"])
    pc_jaro    = _jaro_winkler(a["postcode"], b["postcode"])
    addr_jw    = _jaro_winkler(a["address"],  b["address"])

    # -- Missing-value (null) indicators ------------------------------------
    addr_miss_a = int(not a["address"])
    addr_miss_b = int(not b["address"])
    town_miss_a = int(not a["town"])
    town_miss_b = int(not b["town"])
    pc_miss_a   = int(not a["postcode"])
    pc_miss_b   = int(not b["postcode"])
    both_addr   = int(not a["address"] and not b["address"])
    both_pc     = int(not a["postcode"] and not b["postcode"])

    return {
        # Deterministic character-level similarities
        "name_jaro_winkler":     name_jw,
        "name_levenshtein_norm": name_lev,
        "name_exact":            name_exact,
        "town_jaro_winkler":     town_jw,
        "postcode_exact":        pc_exact,
        "postcode_jaro":         pc_jaro,
        "address_jaro":          addr_jw,
        # Null / missing-value indicators
        "is_address_missing_a":  addr_miss_a,
        "is_address_missing_b":  addr_miss_b,
        "is_town_missing_a":     town_miss_a,
        "is_town_missing_b":     town_miss_b,
        "is_postcode_missing_a": pc_miss_a,
        "is_postcode_missing_b": pc_miss_b,
        "both_address_missing":  both_addr,
        "both_postcode_missing": both_pc,
    }


def run_feature_engineering():
    print("=" * 70)
    print("PHASE 6: ADVANCED FEATURE ENGINEERING")
    print("Character-Level Similarities + Null Indicators + Ensemble Assembly")
    print("=" * 70)

    # ===========================================================================
    # SECTION 4 -- LOAD CANDIDATE PAIRS
    # ===========================================================================
    print("\n[1/5] Loading candidate pair datasets...")

    if os.path.exists(ALL_PAIRS):
        df_pairs = pl.read_parquet(ALL_PAIRS)
        print(f"  -> Full training set: {len(df_pairs):,} pairs")
    elif os.path.exists(VAL_PAIRS):
        df_pairs = pl.read_parquet(VAL_PAIRS)
        print(f"  -> Validation set only: {len(df_pairs):,} pairs")
    else:
        raise FileNotFoundError(
            "No pair datasets found. Run Phase 4 (generate_training_pairs.py) first."
        )

    # Guard required columns
    missing_cols = {"text_a", "text_b", "label"} - set(df_pairs.columns)
    if missing_cols:
        raise ValueError(f"Pair dataset missing required columns: {missing_cols}")

    print(f"  -> Positives: {df_pairs.filter(pl.col('label') == 1).shape[0]:,}")
    print(f"  -> Negatives: {df_pairs.filter(pl.col('label') == 0).shape[0]:,}")

    rows_a  = df_pairs["text_a"].to_list()
    rows_b  = df_pairs["text_b"].to_list()
    labels  = df_pairs["label"].to_list()

    # Carry through any auxiliary columns produced by Phase 4
    CARRY_COLS = ["faiss_similarity", "pair_type", "query_id", "candidate_id"]
    extra_cols = {
        col: df_pairs[col].to_list()
        for col in CARRY_COLS
        if col in df_pairs.columns
    }


    # ===========================================================================
    # SECTION 5 -- CHARACTER-LEVEL FEATURE EXTRACTION
    # ===========================================================================
    print("\n[2/5] Extracting character-level features for all pairs...")

    t0 = time.time()
    feature_rows: list[dict] = []
    for ta, tb in tqdm(zip(rows_a, rows_b), total=len(rows_a),
                       desc="  Feature extraction", unit="pairs"):
        feature_rows.append(compute_pair_features(ta, tb))

    elapsed = time.time() - t0
    print(f"  -> {len(feature_rows):,} pairs processed in {elapsed:.2f}s "
          f"({len(feature_rows) / elapsed:,.0f} pairs/sec)")


    # ===========================================================================
    # SECTION 6 -- CROSS-ENCODER SEMANTIC SCORE (PHASE 5 MODEL)
    # ===========================================================================
    print("\n[3/5] Scoring pairs with fine-tuned Cross-Encoder (Phase 5)...")

    if HAS_CE and os.path.exists(MODEL_DIR):
        cross_encoder  = CrossEncoder(MODEL_DIR, device="cpu")
        pairs_for_ce   = [[a, b] for a, b in zip(rows_a, rows_b)]
        t0             = time.time()
        ce_scores      = cross_encoder.predict(pairs_for_ce, batch_size=64,
                                               show_progress_bar=True)
        ce_time        = time.time() - t0
        ce_scores_list = [float(s) for s in ce_scores]
        print(f"  -> {len(ce_scores_list):,} pairs scored in {ce_time:.2f}s "
              f"({len(ce_scores_list) / ce_time:,.0f} pairs/sec)")
    else:
        reason = ("model directory not found at " + MODEL_DIR
                  if not os.path.exists(MODEL_DIR) else
                  "sentence-transformers not installed")
        print(f"  [SKIP] {reason}")
        print("         cross_encoder_score set to NaN -- run Phase 5 first.")
        ce_scores_list = [float("nan")] * len(feature_rows)


    # ===========================================================================
    # SECTION 7 -- ASSEMBLE ENSEMBLE DATASET
    # ===========================================================================
    print("\n[4/5] Assembling ensemble feature dataset...")

    ensemble_records: list[dict] = []
    for i, feat in enumerate(feature_rows):
        record: dict = {}
        record["cross_encoder_score"] = ce_scores_list[i]  # neural semantic score
        record.update(feat)                                 # deterministic features
        record["label"] = int(labels[i])                   # ground truth
        for col, vals in extra_cols.items():
            record[col] = vals[i]                           # carry-through metadata
        ensemble_records.append(record)

    df_ensemble = pl.DataFrame(ensemble_records)

    # Canonical column order
    ORDERED = [
        "cross_encoder_score",
        "name_jaro_winkler", "name_levenshtein_norm", "name_exact",
        "town_jaro_winkler",
        "postcode_exact", "postcode_jaro",
        "address_jaro",
        "is_address_missing_a", "is_address_missing_b",
        "is_town_missing_a",    "is_town_missing_b",
        "is_postcode_missing_a","is_postcode_missing_b",
        "both_address_missing",  "both_postcode_missing",
        "label",
    ] + [c for c in extra_cols if c in df_ensemble.columns]
    ORDERED = [c for c in ORDERED if c in df_ensemble.columns]

    df_ensemble = df_ensemble.select(ORDERED)
    df_ensemble.write_parquet(OUT_ENSEMBLE, compression="snappy")
    print(f"  -> Saved: {OUT_ENSEMBLE}")
    print(f"  -> Shape: {df_ensemble.shape[0]:,} rows x {df_ensemble.shape[1]} columns")


    # ===========================================================================
    # SECTION 8 -- FEATURE STATISTICS & DISCRIMINATIVE AUDIT
    # ===========================================================================
    print("\n[5/5] Computing feature statistics...")

    FEAT_COLS = [c for c in ORDERED
                 if c not in ("label",) + tuple(extra_cols.keys())]
    stats: dict = {"dataset_rows": len(df_ensemble), "features": {}}

    df_pos = df_ensemble.filter(pl.col("label") == 1)
    df_neg = df_ensemble.filter(pl.col("label") == 0)

    print("\n" + "=" * 78)
    print("PHASE 6 FEATURE STATISTICS AUDIT")
    print("=" * 78)
    print(f"  {'Feature':<30} {'Mean':>8} {'Std':>8} {'Min':>7} {'Max':>7}"
          f"  {'Pos_Mean':>9}  {'Neg_Mean':>9}")
    print("-" * 78)

    for col in FEAT_COLS:
        try:
            series  = df_ensemble[col].drop_nulls()
            m       = float(series.mean())   if len(series) else float("nan")
            s       = float(series.std())    if len(series) else float("nan")
            mn      = float(series.min())    if len(series) else float("nan")
            mx      = float(series.max())    if len(series) else float("nan")
            pm      = float(df_pos[col].drop_nulls().mean()) if len(df_pos) else float("nan")
            nm      = float(df_neg[col].drop_nulls().mean()) if len(df_neg) else float("nan")
            delta   = abs(pm - nm) if pm == pm and nm == nm else float("nan")   # NaN-safe

            print(f"  {col:<30} {m:>8.4f} {s:>8.4f} {mn:>7.4f} {mx:>7.4f}"
                  f"  {pm:>9.4f}  {nm:>9.4f}")

            stats["features"][col] = {
                "mean": round(m, 6), "std": round(s, 6),
                "min":  round(mn, 6), "max": round(mx, 6),
                "mean_positive":       round(pm,    6),
                "mean_negative":       round(nm,    6),
                "discriminative_delta": round(delta, 6),
            }
        except Exception as exc:
            print(f"  {col:<30} [ERROR: {exc}]")

    print("-" * 78)

    # -- Sample pair printout ---------------------------------------------------
    def _show_pair(tag: str, idx: int) -> None:
        row = df_ensemble[idx]
        print(f"\n{tag}")
        print(f"  Text A : {rows_a[idx][:90]}")
        print(f"  Text B : {rows_b[idx][:90]}")
        print(f"  {'Feature':<30}  Value")
        for col in FEAT_COLS:
            try:
                print(f"    {col:<30}  {row[col][0]}")
            except Exception:
                pass

    pos_idx = labels.index(1) if 1 in labels else 0
    neg_idx = labels.index(0) if 0 in labels else 0
    _show_pair("SAMPLE -- POSITIVE PAIR (same entity, injected noise):", pos_idx)
    _show_pair("SAMPLE -- HARD NEGATIVE (high FAISS sim, different entity):", neg_idx)

    # -- Save JSON stats --------------------------------------------------------
    with open(OUT_METRICS, "w", encoding="utf-8") as fh:
        json.dump(stats, fh, indent=2)
    print(f"\n-> Feature statistics JSON saved: {OUT_METRICS}")

    # -- Ranked discriminative features ----------------------------------------
    deltas = [
        (col, stats["features"][col]["discriminative_delta"])
        for col in stats["features"]
        if stats["features"][col]["discriminative_delta"] ==
           stats["features"][col]["discriminative_delta"]   # NaN-safe
    ]
    deltas.sort(key=lambda x: x[1], reverse=True)
    print("\nTOP DISCRIMINATIVE FEATURES  |mean_positive - mean_negative|:")
    for rank, (col, delta) in enumerate(deltas, 1):
        bar = chr(9608) * min(int(delta * 32), 32)
        print(f"  #{rank:02d}  {col:<30}  delta={delta:.4f}  {bar}")

    print("\n" + "=" * 70)
    print("PHASE 6 COMPLETE")
    print(f"  Output    : {OUT_ENSEMBLE}")
    print(f"  Columns   : {ORDERED}")
    print("=" * 70)
    print("\nNEXT STEP (Phase 7 Meta-Classifier):")
    print("  Train XGBoost or LogisticRegression on 'ensemble_features.parquet'")
    print("  Target column: 'label'")
    print("  The model learns to combine neural Cross-Encoder score with")
    print("  deterministic character signals for maximum precision.")


if __name__ == "__main__":
    run_feature_engineering()
