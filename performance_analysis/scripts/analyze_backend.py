#!/usr/bin/env python3
"""
Analyze backend performance breakdown for /api/references/search endpoint
"""

import re
from collections import defaultdict
from statistics import mean, median

def parse_backend_logs(log_file):
    """Parse the performance logs to extract backend timing"""
    
    with open(log_file, 'r') as f:
        content = f.read()
    
    # Extract all RelationshipsSearch operations
    searches = []
    current_search = {}
    
    lines = content.split('\n')
    for line in lines:
        if '[PERF][API] GET /api/references/search - sharedId:' in line:
            # Start of new API call
            current_search = {'operations': {}}
            match = re.search(r'sharedId:\s+(\S+)', line)
            if match:
                current_search['entityId'] = match.group(1)
        
        elif '[PERF][API] GET /api/references/search TOTAL:' in line:
            # End of API call
            match = re.search(r'TOTAL:\s+([\d.]+)\s+ms', line)
            if match:
                current_search['api_total'] = float(match.group(1))
                if current_search.get('entityId'):
                    searches.append(current_search)
                current_search = {}
        
        elif '[PERF][RelationshipsSearch]' in line:
            # Parse individual operation timing
            if 'operations' not in current_search:
                current_search['operations'] = {}
            if 'START' in line:
                continue
            elif 'TOTAL:' in line:
                match = re.search(r'TOTAL:\s+([\d.]+)\s+ms', line)
                if match:
                    current_search['search_total'] = float(match.group(1))
            elif 'processFilterCombinations:' in line:
                match = re.search(r':\s+([\d.]+)\s+ms', line)
                if match:
                    current_search['operations']['filter_process'] = float(match.group(1))
            elif 'getRightSideConnections:' in line:
                match = re.search(r':\s+([\d.]+)\s+ms', line)
                if match:
                    current_search['operations']['right_side_total'] = float(match.group(1))
            elif 'getRightSideConnections - hubsIds query:' in line:
                match = re.search(r':\s+([\d.]+)\s+ms', line)
                if match:
                    current_search['operations']['right_side_hubs_query'] = float(match.group(1))
            elif 'getRightSideConnections - connections query:' in line:
                match = re.search(r':\s+([\d.]+)\s+ms', line)
                if match:
                    current_search['operations']['right_side_conn_query'] = float(match.group(1))
            elif 'ElasticSearch search.search:' in line:
                match = re.search(r':\s+([\d.]+)\s+ms', line)
                if match:
                    current_search['operations']['elasticsearch'] = float(match.group(1))
            elif 'map filteredSharedIds:' in line:
                match = re.search(r':\s+([\d.]+)\s+ms', line)
                if match:
                    current_search['operations']['map_ids'] = float(match.group(1))
            elif 'filterMatchingConnections:' in line:
                match = re.search(r':\s+([\d.]+)\s+ms', line)
                if match:
                    current_search['operations']['filter_matching'] = float(match.group(1))
            elif 'getMatchingHubsCount:' in line:
                match = re.search(r':\s+([\d.]+)\s+ms', line)
                if match:
                    current_search['operations']['hubs_count'] = float(match.group(1))
            elif 'getHubs:' in line:
                match = re.search(r':\s+([\d.]+)\s+ms', line)
                if match:
                    current_search['operations']['get_hubs'] = float(match.group(1))
            elif 'destructureHubsIntoEntities:' in line and 'TOTAL' not in line:
                match = re.search(r':\s+([\d.]+)\s+ms', line)
                if match:
                    current_search['operations']['destructure_total'] = float(match.group(1))
            elif 'destructureHubsIntoEntities - getById:' in line:
                match = re.search(r':\s+([\d.]+)\s+ms', line)
                if match:
                    current_search['operations']['destructure_getbyid'] = float(match.group(1))
            elif 'destructureHubsIntoEntities - build entityMap:' in line:
                match = re.search(r':\s+([\d.]+)\s+ms', line)
                if match:
                    current_search['operations']['destructure_build_map'] = float(match.group(1))
            elif 'destructureHubsIntoEntities - entities.get:' in line:
                match = re.search(r':\s+([\d.]+)\s+ms', line)
                if match:
                    current_search['operations']['destructure_get'] = float(match.group(1))
            elif 'destructureHubsIntoEntities - process connections:' in line:
                match = re.search(r':\s+([\d.]+)\s+ms', line)
                if match:
                    current_search['operations']['destructure_process'] = float(match.group(1))
            elif 'sortBySearchResultOrder:' in line:
                match = re.search(r':\s+([\d.]+)\s+ms', line)
                if match:
                    current_search['operations']['sort'] = float(match.group(1))
    
    return searches

def analyze_operations(searches):
    """Calculate statistics for each operation"""
    
    # Group by operation
    ops_data = defaultdict(list)
    
    for search in searches:
        for op_name, duration in search.get('operations', {}).items():
            ops_data[op_name].append(duration)
        
        # Add totals
        if 'api_total' in search:
            ops_data['api_total'].append(search['api_total'])
        if 'search_total' in search:
            ops_data['search_total'].append(search['search_total'])
    
    # Calculate stats
    results = {}
    for op_name, durations in ops_data.items():
        if durations:
            results[op_name] = {
                'count': len(durations),
                'mean': mean(durations),
                'median': median(durations),
                'min': min(durations),
                'max': max(durations),
            }
    
    return results

def print_analysis(stats, searches):
    """Print formatted analysis"""
    
    print("\n" + "="*80)
    print("BACKEND PERFORMANCE BREAKDOWN - /api/references/search")
    print("="*80)
    print(f"\nTotal searches analyzed: {len(searches)}")
    
    # Get search_total for percentage calculations
    search_total = stats.get('search_total', {}).get('mean', 0)
    
    # Sort operations by mean time
    sorted_ops = sorted(
        [(name, data) for name, data in stats.items() if name not in ['api_total', 'search_total']],
        key=lambda x: x[1]['mean'],
        reverse=True
    )
    
    print("\n" + "-"*80)
    print("OPERATIONS RANKED BY AVERAGE TIME")
    print("-"*80)
    print(f"{'Operation':<40} {'Mean':>10} {'Median':>10} {'% of Total':>12}")
    print("-"*80)
    
    for op_name, data in sorted_ops:
        pct = (data['mean'] / search_total * 100) if search_total > 0 else 0
        print(f"{op_name:<40} {data['mean']:>9.2f}ms {data['median']:>9.2f}ms {pct:>11.1f}%")
    
    print("-"*80)
    if 'search_total' in stats:
        print(f"{'relationshipsSearch TOTAL':<40} {stats['search_total']['mean']:>9.2f}ms {stats['search_total']['median']:>9.2f}ms {100.0:>11.1f}%")
    if 'api_total' in stats:
        print(f"{'API endpoint TOTAL (incl overhead)':<40} {stats['api_total']['mean']:>9.2f}ms {stats['api_total']['median']:>9.2f}ms")
    print()
    
    # Detailed breakdown of major operations
    print("\n" + "="*80)
    print("DETAILED BREAKDOWN OF MAJOR OPERATIONS")
    print("="*80)
    
    # ElasticSearch
    if 'elasticsearch' in stats:
        es = stats['elasticsearch']
        pct = (es['mean'] / search_total * 100) if search_total > 0 else 0
        print(f"\n🔍 ELASTICSEARCH SEARCH")
        print(f"   Mean: {es['mean']:.2f}ms | Median: {es['median']:.2f}ms | {pct:.1f}% of total")
        print(f"   Range: {es['min']:.2f}ms - {es['max']:.2f}ms")
    
    # getRightSideConnections breakdown
    if 'right_side_total' in stats:
        rs = stats['right_side_total']
        pct = (rs['mean'] / search_total * 100) if search_total > 0 else 0
        print(f"\n🔗 GET RIGHT SIDE CONNECTIONS (total)")
        print(f"   Mean: {rs['mean']:.2f}ms | Median: {rs['median']:.2f}ms | {pct:.1f}% of total")
        if 'right_side_hubs_query' in stats:
            hubs = stats['right_side_hubs_query']
            hubs_pct = (hubs['mean'] / rs['mean'] * 100) if rs['mean'] > 0 else 0
            print(f"   ├─ Hubs query: {hubs['mean']:.2f}ms ({hubs_pct:.1f}% of getRightSide)")
        if 'right_side_conn_query' in stats:
            conn = stats['right_side_conn_query']
            conn_pct = (conn['mean'] / rs['mean'] * 100) if rs['mean'] > 0 else 0
            print(f"   └─ Connections query: {conn['mean']:.2f}ms ({conn_pct:.1f}% of getRightSide)")
    
    # destructureHubsIntoEntities breakdown
    if 'destructure_total' in stats:
        dest = stats['destructure_total']
        pct = (dest['mean'] / search_total * 100) if search_total > 0 else 0
        print(f"\n🏗️  DESTRUCTURE HUBS INTO ENTITIES (total)")
        print(f"   Mean: {dest['mean']:.2f}ms | Median: {dest['median']:.2f}ms | {pct:.1f}% of total")
        if 'destructure_getbyid' in stats:
            getbyid = stats['destructure_getbyid']
            getbyid_pct = (getbyid['mean'] / dest['mean'] * 100) if dest['mean'] > 0 else 0
            print(f"   ├─ getById query: {getbyid['mean']:.2f}ms ({getbyid_pct:.1f}% of destructure)")
        if 'destructure_build_map' in stats:
            build = stats['destructure_build_map']
            build_pct = (build['mean'] / dest['mean'] * 100) if dest['mean'] > 0 else 0
            print(f"   ├─ Build entityMap: {build['mean']:.2f}ms ({build_pct:.1f}% of destructure)")
        if 'destructure_get' in stats:
            get = stats['destructure_get']
            get_pct = (get['mean'] / dest['mean'] * 100) if dest['mean'] > 0 else 0
            print(f"   ├─ entities.get query: {get['mean']:.2f}ms ({get_pct:.1f}% of destructure)")
        if 'destructure_process' in stats:
            proc = stats['destructure_process']
            proc_pct = (proc['mean'] / dest['mean'] * 100) if dest['mean'] > 0 else 0
            print(f"   └─ Process connections: {proc['mean']:.2f}ms ({proc_pct:.1f}% of destructure)")
    
    # Other aggregation operations
    if 'hubs_count' in stats:
        hc = stats['hubs_count']
        pct = (hc['mean'] / search_total * 100) if search_total > 0 else 0
        print(f"\n📊 GET MATCHING HUBS COUNT (aggregation)")
        print(f"   Mean: {hc['mean']:.2f}ms | Median: {hc['median']:.2f}ms | {pct:.1f}% of total")
    
    if 'get_hubs' in stats:
        gh = stats['get_hubs']
        pct = (gh['mean'] / search_total * 100) if search_total > 0 else 0
        print(f"\n🔄 GET HUBS (aggregation pipeline)")
        print(f"   Mean: {gh['mean']:.2f}ms | Median: {gh['median']:.2f}ms | {pct:.1f}% of total")
    
    print("\n" + "="*80)
    print("KEY FINDINGS")
    print("="*80)
    
    # Identify the top bottleneck
    if sorted_ops:
        top_op = sorted_ops[0]
        top_pct = (top_op[1]['mean'] / search_total * 100) if search_total > 0 else 0
        print(f"\n🔴 PRIMARY BOTTLENECK: {top_op[0]}")
        print(f"   Takes {top_op[1]['mean']:.2f}ms on average ({top_pct:.1f}% of total search time)")
        
        if len(sorted_ops) > 1:
            second_op = sorted_ops[1]
            second_pct = (second_op[1]['mean'] / search_total * 100) if search_total > 0 else 0
            print(f"\n🟡 SECONDARY BOTTLENECK: {second_op[0]}")
            print(f"   Takes {second_op[1]['mean']:.2f}ms on average ({second_pct:.1f}% of total search time)")
    
    print()

if __name__ == '__main__':
    import sys
    log_file = sys.argv[1] if len(sys.argv) > 1 else 'perf_logs.txt'
    
    print(f"Analyzing backend performance from: {log_file}")
    searches = parse_backend_logs(log_file)
    
    if not searches:
        print("No search operations found in logs!")
        sys.exit(1)
    
    stats = analyze_operations(searches)
    print_analysis(stats, searches)
