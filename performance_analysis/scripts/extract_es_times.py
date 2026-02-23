#!/usr/bin/env python3
import re
import sys
from collections import defaultdict

# Extract ES timings by concurrency level
def extract_es_timings(filename):
    with open(filename, 'r') as f:
        lines = f.readlines()
    
    # Track which concurrency level we're in based on load test output
    current_concurrency = None
    concurrency_timings = defaultdict(list)
    
    for i, line in enumerate(lines):
        # Detect concurrency level changes from load test output
        if 'Starting batch with concurrency:' in line:
            match = re.search(r'concurrency: (\d+)', line)
            if match:
                current_concurrency = int(match.group(1))
                print(f"[DEBUG] Detected concurrency level: {current_concurrency}", file=sys.stderr)
        
        # Extract ES timing
        if 'ElasticSearch search.search:' in line and current_concurrency:
            match = re.search(r'(\d+\.\d+) ms', line)
            if match:
                time = float(match.group(1))
                concurrency_timings[current_concurrency].append(time)
    
    return concurrency_timings

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python3 extract_es_times.py <logfile>")
        sys.exit(1)
    
    timings = extract_es_timings(sys.argv[1])
    
    print("=== ElasticSearch Query Times by Concurrency ===")
    print()
    
    baseline_avg = None
    for concurrency in sorted(timings.keys()):
        times = timings[concurrency]
        if not times:
            continue
        
        avg = sum(times) / len(times)
        min_time = min(times)
        max_time = max(times)
        
        if baseline_avg is None:
            baseline_avg = avg
            degradation = 0
        else:
            degradation = ((avg - baseline_avg) / baseline_avg) * 100
        
        print(f"Concurrency {concurrency:2d}: avg={avg:6.2f}ms  min={min_time:6.2f}ms  max={max_time:6.2f}ms  count={len(times):3d}  degradation=+{degradation:.1f}%")
    
    print()
    print("=== Summary Table ===")
    print()
    print("| Concurrency | Avg ES Time | Degradation |")
    print("|-------------|-------------|-------------|")
    
    baseline_avg = None
    for concurrency in sorted(timings.keys()):
        times = timings[concurrency]
        if not times:
            continue
        
        avg = sum(times) / len(times)
        
        if baseline_avg is None:
            baseline_avg = avg
            print(f"| {concurrency:11d} | {avg:8.2f}ms | Baseline    |")
        else:
            degradation = ((avg - baseline_avg) / baseline_avg) * 100
            print(f"| {concurrency:11d} | {avg:8.2f}ms | +{degradation:7.1f}%  |")

