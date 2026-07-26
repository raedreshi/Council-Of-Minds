import json
from collections import defaultdict

# 1. Load benchmark results
with open("benchmark_results_100.json", "r") as f:
    results = json.load(f)

domain_stats = defaultdict(lambda: {
    "count": 0,
    "baseline_words": 0,
    "council_words": 0
})

total_baseline_words = 0
total_council_words = 0

# 2. Process metrics
for entry in results:
    domain = entry["domain"]
    b_words = len(entry["baseline"].split())
    c_words = len(entry["council_of_minds"].split())
    
    domain_stats[domain]["count"] += 1
    domain_stats[domain]["baseline_words"] += b_words
    domain_stats[domain]["council_words"] += c_words
    
    total_baseline_words += b_words
    total_council_words += c_words

total_runs = len(results)

# 3. Print Summary Report
print("=" * 60)
print(f"BENCHMARK ANALYSIS REPORT ({total_runs} Executions Processed)")
print("=" * 60)
print(f"Total Output Volume:")
print(f"  - Baseline Total Words:       {total_baseline_words:,}")
print(f"  - Council Total Words:        {total_council_words:,}")
print(f"  - Avg Length per Response:    Baseline ({total_baseline_words // total_runs} words) vs Council ({total_council_words // total_runs} words)")
print("-" * 60)
print(f"{'Domain':<25} | {'Runs':<5} | {'Avg Baseline Wd':<15} | {'Avg Council Wd':<15}")
print("-" * 60)

for domain, stats in domain_stats.items():
    avg_b = stats["baseline_words"] // stats["count"]
    avg_c = stats["council_words"] // stats["count"]
    print(f"{domain:<25} | {stats['count']:<5} | {avg_b:<15} | {avg_c:<15}")

print("=" * 60)