#!/usr/bin/env python3

import re
import sys
from collections import defaultdict
from statistics import mean, median, stdev

def parse_perf_logs(filename):
    """Parse performance logs and extract metrics by concurrency level."""
    
    data = {
        'by_concurrency': defaultdict(lambda: defaultdict(list)),
        'by_relationships': defaultdict(lambda: defaultdict(list)),
        'operations': defaultdict(list)
    }
    
    with open(filename, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    # Split by SSR request (each request ends with TOTAL SSR TIME)
    requests = re.split(r'\[PERF\]\[SSR\] TOTAL SSR TIME:', content)
    
    concurrency_level = 1  # Track which test phase we're in
    request_count = 0
    
    for request_block in requests[1:]:  # Skip first split (header)
        request_count += 1
        
        # Determine concurrency level based on request count
        if request_count <= 30:
            concurrency_level = 1
        elif request_count <= 60:
            concurrency_level = 5
        elif request_count <= 90:
            concurrency_level = 10
        else:
            concurrency_level = 20
        
        # Extract total SSR time
        ssr_match = re.match(r'\s*([\d.]+)\s*ms', request_block)
        if ssr_match:
            ssr_time = float(ssr_match.group(1))
            data['by_concurrency'][concurrency_level]['ssr_total'].append(ssr_time)
        
        # Extract all performance metrics from this request
        perf_lines = re.findall(r'\[PERF\](.+)', request_block)
        
        for line in perf_lines:
            # Store data preparation time
            if 'Store data preparation:' in line:
                match = re.search(r'([\d.]+)\s*ms', line)
                if match:
                    data['by_concurrency'][concurrency_level]['store_prep'].append(float(match.group(1)))
                    data['operations']['store_prep'].append(float(match.group(1)))
            
            # Data loader execution
            elif 'Data loader' in line and 'execution:' in line:
                match = re.search(r'([\d.]+)\s*ms', line)
                if match:
                    data['by_concurrency'][concurrency_level]['data_loader'].append(float(match.group(1)))
                    data['operations']['data_loader'].append(float(match.group(1)))
            
            # RequestState execution
            elif 'RequestState execution:' in line:
                match = re.search(r'([\d.]+)\s*ms', line)
                if match:
                    data['by_concurrency'][concurrency_level]['requeststate'].append(float(match.group(1)))
                    data['operations']['requeststate'].append(float(match.group(1)))
            
            # React rendering
            elif 'React component rendering:' in line:
                match = re.search(r'([\d.]+)\s*ms', line)
                if match:
                    data['by_concurrency'][concurrency_level]['react_render'].append(float(match.group(1)))
                    data['operations']['react_render'].append(float(match.group(1)))
            
            # Relationships API
            elif 'GET /api/references/group_by_connection TOTAL:' in line:
                match = re.search(r'([\d.]+)\s*ms', line)
                if match:
                    data['by_concurrency'][concurrency_level]['relationships_api'].append(float(match.group(1)))
                    data['operations']['relationships_api'].append(float(match.group(1)))
            
            # getDocumentHubs
            elif 'getDocumentHubs TOTAL:' in line:
                match = re.search(r'([\d.]+)\s*ms', line)
                if match:
                    data['operations']['getDocumentHubs'].append(float(match.group(1)))
            
            # getByDocument
            elif 'getByDocument TOTAL:' in line:
                match = re.search(r'([\d.]+)\s*ms', line)
                if match:
                    data['operations']['getByDocument'].append(float(match.group(1)))
            
            # Extract relationship counts
            elif 'getDocumentHubs - ownRelations query:' in line:
                rel_match = re.search(r'Relations count:\s*(\d+)', line)
                time_match = re.search(r'([\d.]+)\s*ms', line)
                if rel_match and time_match:
                    rel_count = int(rel_match.group(1))
                    query_time = float(time_match.group(1))
                    if rel_count > 0:  # Only track non-zero relationships
                        data['by_relationships'][rel_count]['query_time'].append(query_time)
                        data['by_relationships'][rel_count]['concurrency'].append(concurrency_level)
    
    return data

def print_stats(label, values):
    """Print statistical summary of a metric."""
    if not values:
        return
    
    avg = mean(values)
    med = median(values)
    min_val = min(values)
    max_val = max(values)
    std = stdev(values) if len(values) > 1 else 0
    
    print(f"  {label:30} avg={avg:7.1f}ms  med={med:7.1f}ms  min={min_val:7.1f}ms  max={max_val:7.1f}ms  std={std:6.1f}ms  n={len(values)}")

def analyze_data(data):
    """Analyze and print comprehensive performance statistics."""
    
    print("=" * 100)
    print("PERFORMANCE ANALYSIS - CONCURRENT LOAD TEST WITH HIGH-RELATIONSHIP ENTITIES")
    print("=" * 100)
    
    # Overall operation performance
    print("\n### OVERALL OPERATION PERFORMANCE (All Requests) ###\n")
    
    for op_name, values in sorted(data['operations'].items(), key=lambda x: -mean(x[1]) if x[1] else 0):
        print_stats(op_name, values)
    
    # Performance by concurrency level
    print("\n\n### PERFORMANCE BY CONCURRENCY LEVEL ###\n")
    
    for concurrency in sorted(data['by_concurrency'].keys()):
        metrics = data['by_concurrency'][concurrency]
        
        print(f"\n--- Concurrency: {concurrency} simultaneous requests ---")
        
        for metric_name, values in sorted(metrics.items(), key=lambda x: -mean(x[1]) if x[1] else 0):
            if values:
                print_stats(metric_name, values)
        
        # Calculate degradation vs baseline (concurrency=1)
        if concurrency > 1 and 'ssr_total' in metrics:
            baseline = data['by_concurrency'][1].get('ssr_total', [])
            if baseline:
                baseline_avg = mean(baseline)
                current_avg = mean(metrics['ssr_total'])
                degradation = ((current_avg / baseline_avg - 1) * 100)
                print(f"\n  Performance degradation vs concurrency=1: +{degradation:.1f}%")
    
    # Performance by relationship count
    print("\n\n### PERFORMANCE BY RELATIONSHIP COUNT ###\n")
    print(f"{'Relationships':>15} | {'Avg Query Time':>15} | {'Requests':>10} | {'Concurrency Levels':>20}")
    print("-" * 80)
    
    for rel_count in sorted(data['by_relationships'].keys(), reverse=True):
        metrics = data['by_relationships'][rel_count]
        query_times = metrics['query_time']
        concurrencies = set(metrics['concurrency'])
        
        if query_times:
            avg_time = mean(query_times)
            print(f"{rel_count:>15} | {avg_time:>13.2f}ms | {len(query_times):>10} | {sorted(concurrencies)}")
    
    # Correlation analysis
    print("\n\n### CORRELATION ANALYSIS ###\n")
    
    # Relationship count vs query time
    if data['by_relationships']:
        print("Relationship Count vs Query Time:")
        rel_counts = []
        query_times = []
        for rel_count, metrics in data['by_relationships'].items():
            if metrics['query_time']:
                rel_counts.append(rel_count)
                query_times.append(mean(metrics['query_time']))
        
        if len(rel_counts) > 1:
            # Simple correlation
            from math import sqrt
            n = len(rel_counts)
            sum_x = sum(rel_counts)
            sum_y = sum(query_times)
            sum_xy = sum(x * y for x, y in zip(rel_counts, query_times))
            sum_x2 = sum(x * x for x in rel_counts)
            sum_y2 = sum(y * y for y in query_times)
            
            correlation = (n * sum_xy - sum_x * sum_y) / sqrt((n * sum_x2 - sum_x * sum_x) * (n * sum_y2 - sum_y * sum_y))
            print(f"  Pearson correlation coefficient: {correlation:.3f}")
            
            if correlation > 0.7:
                print("  ⚠️  STRONG positive correlation - query time increases significantly with relationship count")
            elif correlation > 0.3:
                print("  ✓  MODERATE positive correlation - some impact from relationship count")
            else:
                print("  ✓  WEAK correlation - relationship count has minimal impact on query time")
    
    print("\n" + "=" * 100)

if __name__ == '__main__':
    filename = sys.argv[1] if len(sys.argv) > 1 else 'perf_logs.txt'
    
    try:
        data = parse_perf_logs(filename)
        analyze_data(data)
    except FileNotFoundError:
        print(f"Error: File '{filename}' not found")
        sys.exit(1)
    except Exception as e:
        print(f"Error analyzing logs: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
