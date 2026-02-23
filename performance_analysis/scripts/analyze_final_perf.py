#!/usr/bin/env python3
import re
import sys
from collections import defaultdict

# Parse final performance logs and create execution tree
def parse_logs(filename):
    with open(filename, 'r') as f:
        lines = f.readlines()
    
    # Extract SSR total times
    ssr_times = []
    api_search_times = []
    relationshipsearch_times = []
    es_times = []
    mongodb_times = []
    
    for line in lines:
        if 'TOTAL SSR TIME:' in line:
            match = re.search(r'(\d+\.\d+) ms', line)
            if match:
                ssr_times.append(float(match.group(1)))
        
        if '[API] GET /api/references/search TOTAL:' in line:
            match = re.search(r'(\d+\.\d+) ms', line)
            if match:
                api_search_times.append(float(match.group(1)))
        
        if '[RelationshipsSearch] TOTAL:' in line:
            match = re.search(r'(\d+\.\d+) ms', line)
            if match:
                relationshipsearch_times.append(float(match.group(1)))
        
        if 'ElasticSearch search.search:' in line:
            match = re.search(r'(\d+\.\d+) ms', line)
            if match:
                es_times.append(float(match.group(1)))
        
        if 'getHubs:' in line or 'getMatchingHubsCount:' in line:
            match = re.search(r'(\d+\.\d+) ms', line)
            if match:
                mongodb_times.append(float(match.group(1)))
    
    # Calculate averages (skip first 2 as warmup)
    avg_ssr = sum(ssr_times[2:]) / len(ssr_times[2:]) if len(ssr_times) > 2 else 0
    avg_api_search = sum(api_search_times[2:]) / len(api_search_times[2:]) if len(api_search_times) > 2 else 0
    avg_relationships = sum(relationshipsearch_times[2:]) / len(relationshipsearch_times[2:]) if len(relationshipsearch_times) > 2 else 0
    avg_es = sum(es_times[2:]) / len(es_times[2:]) if len(es_times) > 2 else 0
    avg_mongodb = sum(mongodb_times[2:]) / len(mongodb_times[2:]) if len(mongodb_times) > 2 else 0
    
    return {
        'ssr': avg_ssr,
        'api_search': avg_api_search,
        'relationships': avg_relationships,
        'es': avg_es,
        'mongodb': avg_mongodb
    }

# Get detailed breakdown from last request
def get_last_request_breakdown(filename):
    with open(filename, 'r') as f:
        lines = f.readlines()
    
    # Find the last complete SSR request
    last_ssr_index = -1
    for i in range(len(lines) - 1, -1, -1):
        if 'TOTAL SSR TIME:' in lines[i]:
            last_ssr_index = i
            break
    
    if last_ssr_index == -1:
        return {}
    
    # Extract timing from the last request
    breakdown = {}
    
    # Work backwards from SSR TOTAL to find all components
    for i in range(last_ssr_index, max(0, last_ssr_index - 50), -1):
        line = lines[i]
        
        if 'RequestState execution:' in line:
            match = re.search(r'(\d+\.\d+) ms', line)
            if match:
                breakdown['requestState'] = float(match.group(1))
        
        if 'React component rendering:' in line:
            match = re.search(r'(\d+\.\d+) ms', line)
            if match:
                breakdown['rendering'] = float(match.group(1))
        
        if 'Global resources fetch:' in line:
            match = re.search(r'(\d+\.\d+) ms', line)
            if match:
                breakdown['resources'] = float(match.group(1))
        
        if '[RelationshipsSearch] TOTAL:' in line:
            match = re.search(r'(\d+\.\d+) ms', line)
            if match:
                breakdown['relationshipsSearch'] = float(match.group(1))
        
        if 'ElasticSearch search.search:' in line:
            match = re.search(r'(\d+\.\d+) ms', line)
            if match:
                breakdown['es'] = float(match.group(1))
        
        if 'getRightSideConnections:' in line:
            match = re.search(r'(\d+\.\d+) ms', line)
            if match:
                breakdown['getRightSide'] = float(match.group(1))
        
        if 'getMatchingHubsCount:' in line:
            match = re.search(r'(\d+\.\d+) ms', line)
            if match:
                breakdown['getCount'] = float(match.group(1))
        
        if 'getHubs:' in line:
            match = re.search(r'(\d+\.\d+) ms', line)
            if match:
                breakdown['getHubs'] = float(match.group(1))
    
    return breakdown

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python3 analyze_final_perf.py <logfile>")
        sys.exit(1)
    
    averages = parse_logs(sys.argv[1])
    breakdown = get_last_request_breakdown(sys.argv[1])
    
    print("=== AVERAGE TIMINGS (excluding first 2 warmup requests) ===")
    print(f"Total SSR:              {averages['ssr']:.2f} ms")
    print(f"API /references/search: {averages['api_search']:.2f} ms")
    print(f"relationshipsSearch:    {averages['relationships']:.2f} ms")
    print(f"ElasticSearch:          {averages['es']:.2f} ms")
    print(f"MongoDB operations:     {averages['mongodb']:.2f} ms")
    print()
    print("=== LAST REQUEST DETAILED BREAKDOWN ===")
    for key, value in sorted(breakdown.items(), key=lambda x: x[1], reverse=True):
        print(f"{key:30s} {value:8.2f} ms")
