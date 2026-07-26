import json
import os

# 1. Try finding the file in current directory first, then Desktop
possible_paths = [
    "benchmark_results_100.json",
    r"C:\Users\HP\Desktop\benchmark_results_100.json"
]

file_path = None
for path in possible_paths:
    if os.path.exists(path):
        file_path = path
        break

if not file_path:
    print("ERROR: Could not find benchmark_results_100.json!")
    print(f"Current working directory is: {os.getcwd()}")
    exit(1)

print(f"Found results file at: {os.path.abspath(file_path)}\n")

with open(file_path, "r", encoding="utf-8") as f:
    results = json.load(f)

# Common AI hedging and safety disclaimers
disclaimers = [
    "as an ai", "as a language model", "it's important to note", 
    "it is important to consider both sides", "i cannot take a position", 
    "as a responsible ai", "both perspectives have merit"
]

baseline_disclaimer_count = 0
council_disclaimer_count = 0

for entry in results:
    b_text = entry["baseline"].lower()
    c_text = entry["council_of_minds"].lower()
    
    if any(phrase in b_text for phrase in disclaimers):
        baseline_disclaimer_count += 1
    if any(phrase in c_text for phrase in disclaimers):
        council_disclaimer_count += 1

print("=" * 55)
print("QUALITATIVE RULE COMPLIANCE AUDIT")
print("=" * 55)
print(f"Total Benchmark Executions Audited: {len(results)}")
print(f"Baseline Disclaimer Rate:  {baseline_disclaimer_count / len(results) * 100:.1f}% ({baseline_disclaimer_count}/{len(results)})")
print(f"Council Disclaimer Rate:   {council_disclaimer_count / len(results) * 100:.1f}% ({council_disclaimer_count}/{len(results)})")
print("=" * 55)

if council_disclaimer_count == 0:
    print("SUCCESS: Council of Minds achieved 100% disclaimer suppression!")
else:
    print(f"NOTE: Council responses triggered {council_disclaimer_count} disclaimers.")