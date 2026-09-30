import sys
import os
import time
import json
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from sentence_transformers import CrossEncoder  # type: ignore
import polars as pl
import numpy as np
import matplotlib.pyplot as plt

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

print("=" * 70)
print("PHASE 5: STAGE 2 - FINE-TUNING THE CROSS-ENCODER")
print("Cross-Attention Transformer for Precision Entity Matching")
print("=" * 70)

t_start = time.time()
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
train_parquet = os.path.join(PROJECT_ROOT, "data", "processed", "train_pairs.parquet")
val_parquet = os.path.join(PROJECT_ROOT, "data", "processed", "val_pairs.parquet")
model_output_dir = os.path.join(PROJECT_ROOT, "models", "fine_tuned_cross_encoder")
base_model_name = "cross-encoder/ms-marco-MiniLM-L-6-v2"
chart_dir = os.path.join(PROJECT_ROOT, "reports", "figures")
os.makedirs(model_output_dir, exist_ok=True)
os.makedirs(chart_dir, exist_ok=True)

# Hardware Detection: Check GPU and fallback to multi-core CPU
torch.set_num_threads(16)
device = "cuda" if torch.cuda.is_available() else "cpu"
if device == "cuda":
    try:
        _ = (torch.randn(2, 2, device='cuda') @ torch.randn(2, 2, device='cuda'))
        print(f"-> Using GPU: {torch.cuda.get_device_name(0)}")
    except Exception as e:
        print(f"-> CUDA compute unavailable on current PyTorch build ({e}).")
        print("-> Falling back to 16 multi-threaded CPU cores.")
        device = "cpu"
else:
    print(f"-> Using CPU with 16 execution threads.")

# Step 1: Load and Format Training Pairs
print(f"\n[1/5] Loading paired datasets from {train_parquet} and {val_parquet}...")
df_train = pl.read_parquet(train_parquet)
df_val = pl.read_parquet(val_parquet)

print(f"-> Training pairs loaded  : {len(df_train):,} pairs (Pos: {(df_train['label']==1).sum():,}, Neg: {(df_train['label']==0).sum():,})")
print(f"-> Validation pairs loaded: {len(df_val):,} pairs (Pos: {(df_val['label']==1).sum():,}, Neg: {(df_val['label']==0).sum():,})")

# Subsample a fast, representative benchmark set for interactive fine-tuning
train_subset_size = min(3000, len(df_train))
val_subset_size = min(800, len(df_val))

class PairDataset(Dataset):
    def __init__(self, df, max_rows):
        sub_df = df.head(max_rows)
        self.texts_a = sub_df['text_a'].to_list()
        self.texts_b = sub_df['text_b'].to_list()
        self.labels = sub_df['label'].to_list()

    def __len__(self):
        return len(self.labels)

    def __getitem__(self, index):
        return {
            'text_a': self.texts_a[index],
            'text_b': self.texts_b[index],
            'label': float(self.labels[index])
        }

train_dataset = PairDataset(df_train, train_subset_size)
val_dataset = PairDataset(df_val, val_subset_size)

batch_size = 32
train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)

# Step 2: Initialize Pre-trained Cross-Encoder
print(f"\n[2/5] Initializing Cross-Encoder backbone: '{base_model_name}'...")
cross_enc = CrossEncoder(base_model_name, num_labels=1, device=device)
pt_model = cross_enc.model
tokenizer = cross_enc.tokenizer
assert pt_model is not None, "CrossEncoder backbone model failed to load"
assert tokenizer is not None, "CrossEncoder tokenizer failed to load"

def evaluate_model(model, dataloader, device):
    """Evaluates binary accuracy, F1 score, and average loss."""
    model.eval()
    all_preds = []
    all_labels = []
    total_loss = 0.0
    criterion = nn.BCEWithLogitsLoss()
    
    with torch.no_grad():
        for batch in dataloader:
            inputs = tokenizer(
                batch['text_a'],
                batch['text_b'],
                padding=True,
                truncation=True,
                max_length=128,
                return_tensors='pt'
            ).to(device)
            labels = torch.tensor(batch['label'], dtype=torch.float32, device=device)
            
            logits = model(**inputs).logits.squeeze(-1)
            loss = criterion(logits, labels)
            total_loss += loss.item() * len(labels)
            
            probs = torch.sigmoid(logits).cpu().numpy()
            all_preds.extend(probs)
            all_labels.extend(labels.cpu().numpy())
            
    all_preds = np.array(all_preds)
    all_labels = np.array(all_labels)
    binary_preds = (all_preds >= 0.5).astype(int)
    
    acc = np.mean(binary_preds == all_labels)
    tp = np.sum((binary_preds == 1) & (all_labels == 1))
    fp = np.sum((binary_preds == 1) & (all_labels == 0))
    fn = np.sum((binary_preds == 0) & (all_labels == 1))
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0.0
    avg_loss = total_loss / len(all_labels)
    
    return {
        "accuracy": float(acc),
        "f1": float(f1),
        "precision": float(precision),
        "recall": float(recall),
        "loss": float(avg_loss),
        "probabilities": all_preds,
        "labels": all_labels
    }

# Step 3: Measure Baseline Zero-Shot Performance
print("\n[3/5] Evaluating Pre-Trained Baseline (Zero-Shot) Performance on Validation Set...")
t_eval_start = time.time()
baseline_metrics = evaluate_model(pt_model, val_loader, device)
print(f"-> Baseline Pre-Trained Accuracy: {baseline_metrics['accuracy']*100:.2f}%")
print(f"-> Baseline Pre-Trained F1-Score: {baseline_metrics['f1']:.4f}")
print(f"-> Baseline Validation Loss     : {baseline_metrics['loss']:.4f}")
print(f"-> Evaluation Runtime           : {time.time() - t_eval_start:.2f}s")

# Step 4: Execute Native PyTorch Training Loop
print(f"\n[4/5] Executing Cross-Encoder Fine-Tuning Loop...")
print(f"-> Training Set Size: {len(train_dataset):,} pairs | Batch Size: {batch_size}")
print(f"-> Optimizer: AdamW (lr=2e-5, weight_decay=0.01) | Loss: BCEWithLogitsLoss")

optimizer = torch.optim.AdamW(pt_model.parameters(), lr=2e-5, weight_decay=0.01)
criterion = nn.BCEWithLogitsLoss()
num_epochs = 2

epoch_losses = []
val_accuracies = []

t_train_start = time.time()
for epoch in range(1, num_epochs + 1):
    pt_model.train()
    running_loss = 0.0
    total_samples = 0
    t_epoch_start = time.time()
    
    for step, batch in enumerate(train_loader, 1):
        inputs = tokenizer(
            batch['text_a'],
            batch['text_b'],
            padding=True,
            truncation=True,
            max_length=128,
            return_tensors='pt'
        ).to(device)
        labels = torch.tensor(batch['label'], dtype=torch.float32, device=device)
        
        optimizer.zero_grad()
        logits = pt_model(**inputs).logits.squeeze(-1)
        loss = criterion(logits, labels)
        loss.backward()
        nn.utils.clip_grad_norm_(pt_model.parameters(), 1.0)
        optimizer.step()
        
        running_loss += loss.item() * len(labels)
        total_samples += len(labels)
        
        if step % 25 == 0 or step == len(train_loader):
            print(f"   Epoch {epoch}/{num_epochs} [Step {step:2d}/{len(train_loader)}] Current Batch Loss: {loss.item():.4f}")
            
    epoch_loss = running_loss / total_samples
    epoch_losses.append(epoch_loss)
    epoch_val = evaluate_model(pt_model, val_loader, device)
    val_accuracies.append(epoch_val['accuracy'])
    epoch_duration = time.time() - t_epoch_start
    print(f"-> Epoch {epoch} Complete in {epoch_duration:.2f}s | Train Loss: {epoch_loss:.4f} | Val Accuracy: {epoch_val['accuracy']*100:.2f}% | Val F1: {epoch_val['f1']:.4f}")

train_elapsed = time.time() - t_train_start
print(f"\n-> Fine-tuning completed in {train_elapsed:.2f}s!")

# Save fine-tuned weights
pt_model.save_pretrained(model_output_dir)
tokenizer.save_pretrained(model_output_dir)
print(f"-> Model & Tokenizer weights saved to: {model_output_dir}")

# Step 5: Post-Training Validation & Metric Comparison
print("\n[5/5] Computing Final Post-Tuning Performance & Decision Boundaries...")
final_metrics = evaluate_model(pt_model, val_loader, device)

print("\n" + "=" * 70)
print("CROSS-ENCODER VALIDATION BENCHMARKS")
print("=" * 70)
print(f"Validation Sample Size : {val_subset_size:,} pairs")
print(f"Final Model Accuracy   : {final_metrics['accuracy']*100:.2f}% (Baseline: {baseline_metrics['accuracy']*100:.2f}%)")
print(f"Final Model F1-Score   : {final_metrics['f1']:.4f} (Baseline: {baseline_metrics['f1']:.4f})")
print(f"Final Model Precision  : {final_metrics['precision']:.4f} (Baseline: {baseline_metrics['precision']:.4f})")
print(f"Final Model Recall     : {final_metrics['recall']:.4f} (Baseline: {baseline_metrics['recall']:.4f})")
print(f"Validation Loss        : {final_metrics['loss']:.4f} (Baseline: {baseline_metrics['loss']:.4f})")

# Step 6: Test on Critical Diagnostic Case Studies
print("\n" + "=" * 70)
print("CASE STUDY PREDICTIONS (Cross-Attention Precision Audit)")
print("=" * 70)

diagnostic_cases = [
    # Case 1: Typo in business name (Should be MATCH: 1.0)
    (
        "[NAME] heal ur tech [ADDR] 5 bridge street [TOWN] guildford [ZIP] gu1 4ry [TYPE] private limited company",
        "[NAME] heal ur tehch [ADDR] 5 bridge st [TOWN] guildford [ZIP] gu14ry",
        "Positive (Typo & Street Abbreviation)"
    ),
    # Case 2: Different company at exact same address (Hard Negative - Should be NO-MATCH: 0.0)
    (
        "[NAME] 002 02092021 [ADDR] pr house [TOWN] telford [ZIP] tf1 7et [TYPE] private limited company",
        "[NAME] 003 02092021 [ADDR] pr house [TOWN] telford [ZIP] tf1 7et [TYPE] private limited company",
        "Hard Negative (Same Address, Different Company ID: 002 vs 003)"
    ),
    # Case 3: Same company with missing category and dropped word (Should be MATCH: 1.0)
    (
        "[NAME] big impact graphics [ADDR] 372 old street [TOWN] london [ZIP] ec1v 9lt [TYPE] private limited company",
        "[NAME] big graphics [ADDR] 372 old st [TOWN] london [ZIP] ec1v 9lt",
        "Positive (Dropped Word & Address Abbreviation)"
    ),
    # Case 4: Completely different companies sharing building (Hard Negative - Should be NO-MATCH: 0.0)
    (
        "[NAME] 1 2 1 counselling [TYPE] charitable incorporated organisation",
        "[NAME] learn to love to read [TYPE] charitable incorporated organisation",
        "Hard Negative (Same Type, Different Mission)"
    )
]

pt_model.eval()
with torch.no_grad():
    for i, (text_a, text_b, desc) in enumerate(diagnostic_cases):
        inputs = tokenizer(text_a, text_b, padding=True, truncation=True, max_length=128, return_tensors='pt').to(device)
        logit = pt_model(**inputs).logits.squeeze(-1).item()
        prob = 1.0 / (1.0 + np.exp(-logit))
        decision = "MATCH (1.0)" if prob >= 0.5 else "NO-MATCH (0.0)"
        
        print(f"Test Case {i+1}: {desc}")
        print(f"  Record A: {text_a}")
        print(f"  Record B: {text_b}")
        print(f"  Logit: {logit:.3f} | Sigmoid Probability: {prob:.4f} | Prediction -> {decision}")
        print("-" * 65)

# Generate Diagnostic Visualization Chart
chart_path = os.path.join(chart_dir, "cross_encoder_evaluation.png")
fig, ax = plt.subplots(figsize=(9, 5))
metrics_names = ['Accuracy', 'F1-Score', 'Precision', 'Recall']
baseline_vals = [baseline_metrics['accuracy'], baseline_metrics['f1'], baseline_metrics['precision'], baseline_metrics['recall']]
final_vals = [final_metrics['accuracy'], final_metrics['f1'], final_metrics['precision'], final_metrics['recall']]

x = np.arange(len(metrics_names))
width = 0.35

ax.bar(x - width/2, [v*100 for v in baseline_vals], width, label='Zero-Shot Pre-Trained', color='#94a3b8')
ax.bar(x + width/2, [v*100 for v in final_vals], width, label='Fine-Tuned Cross-Encoder', color='#10b981')

ax.set_ylabel('Score (%)', fontsize=11)
ax.set_title('Cross-Encoder Precision Verification: Before vs After Fine-Tuning', fontsize=13, fontweight='bold')
ax.set_xticks(x)
ax.set_xticklabels(metrics_names, fontsize=11)
ax.set_ylim(0, 105)
ax.legend(fontsize=10)

for i in range(len(metrics_names)):
    ax.text(i - width/2, baseline_vals[i]*100 + 1.5, f"{baseline_vals[i]*100:.1f}%", ha='center', fontsize=9)
    ax.text(i + width/2, final_vals[i]*100 + 1.5, f"{final_vals[i]*100:.1f}%", ha='center', fontsize=9, fontweight='bold')

plt.tight_layout()
plt.savefig(chart_path, dpi=200)
plt.close()
print(f"-> Evaluation chart saved to: {chart_path}")

print(f"\nPhase 5 pipeline executed successfully in {time.time() - t_start:.2f} seconds.")
