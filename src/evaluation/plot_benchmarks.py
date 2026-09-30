import os
import json
import matplotlib.pyplot as plt
import numpy as np

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
METRICS_PATH = os.path.join(PROJECT_ROOT, "reports", "metrics", "evaluation_metrics.json")
OUTPUT_CHART = os.path.join(PROJECT_ROOT, "reports", "figures", "pipeline_benchmarks.png")

with open(METRICS_PATH, "r", encoding="utf-8") as f:
    metrics = json.load(f)

fig, axes = plt.subplots(1, 3, figsize=(18, 5))

# 1. Pipeline Metrics Bar Chart
ax1 = axes[0]
metric_names = ["Precision", "Recall", "Accuracy", "F1-Score"]
metric_values = [
    metrics["precision"] * 100,
    metrics["recall"] * 100,
    metrics["accuracy"] * 100,
    metrics["f1_score"] * 100
]
colors = ["#2563EB", "#10B981", "#8B5CF6", "#F59E0B"]
bars = ax1.bar(metric_names, metric_values, color=colors, width=0.55, edgecolor="#1E293B", linewidth=1.2)
ax1.axhline(95, color="#EF4444", linestyle="--", linewidth=1.5, label="Target (>95%)")
ax1.set_ylim(85, 102)
ax1.set_title("Hold-Out Test Performance (\\tau = 0.85)", fontsize=13, fontweight="bold", pad=12)
ax1.set_ylabel("Score (%)", fontsize=11)
ax1.legend(loc="lower right")
for bar in bars:
    yval = bar.get_height()
    ax1.text(bar.get_x() + bar.get_width()/2, yval + 0.6, f"{yval:.2f}%", ha='center', va='bottom', fontweight='bold', fontsize=11)
ax1.grid(axis='y', alpha=0.3)

# 2. Confusion Matrix Heatmap
ax2 = axes[1]
cm = metrics["confusion_matrix"]
matrix = np.array([[cm["tn"], cm["fp"]], [cm["fn"], cm["tp"]]])
im = ax2.imshow(matrix, cmap="Blues", interpolation='nearest')
ax2.set_xticks([0, 1])
ax2.set_yticks([0, 1])
ax2.set_xticklabels(["Predicted Neg", "Predicted Match"], fontsize=11, fontweight="bold")
ax2.set_yticklabels(["Actual Neg", "Actual Match"], fontsize=11, fontweight="bold")
ax2.set_title(f"Confusion Matrix (N = {metrics['sample_count']:,})", fontsize=13, fontweight="bold", pad=12)

# Annotate cells
thresh = matrix.max() / 2.0
labels = [
    [f"TN\n{cm['tn']:,}", f"FP (Merged)\n{cm['fp']:,}"],
    [f"FN (Missed)\n{cm['fn']:,}", f"TP (Matches)\n{cm['tp']:,}"]
]
for i in range(2):
    for j in range(2):
        ax2.text(j, i, labels[i][j], ha="center", va="center",
                 color="white" if matrix[i, j] > thresh else "black",
                 fontsize=12, fontweight="bold")

# 3. Latency Breakdown
ax3 = axes[2]
lat = metrics["latency_benchmarks_ms"]
lat_labels = ["Mean Latency", "Median (P50)", "P95 Latency", "Target Max"]
lat_values = [lat["mean"], lat["median"], lat["p95"], 150.0]
bar_colors = ["#3B82F6", "#06B6D4", "#6366F1", "#EF4444"]
lat_bars = ax3.bar(lat_labels, lat_values, color=bar_colors, width=0.55, edgecolor="#1E293B", linewidth=1.2)
ax3.set_ylim(0, 180)
ax3.set_title("End-to-End Resolution Latency (CPU)", fontsize=13, fontweight="bold", pad=12)
ax3.set_ylabel("Time (milliseconds)", fontsize=11)
for bar in lat_bars:
    yval = bar.get_height()
    ax3.text(bar.get_x() + bar.get_width()/2, yval + 3, f"{yval:.1f} ms", ha='center', va='bottom', fontweight='bold', fontsize=11)
ax3.grid(axis='y', alpha=0.3)

plt.tight_layout()
plt.savefig(OUTPUT_CHART, dpi=300)
print(f"Chart saved to {OUTPUT_CHART}")
