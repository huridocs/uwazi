#!/usr/bin/env python3

import re
from collections import defaultdict
from statistics import mean, median, stdev

def parse_dataloader_logs(filename):
    """Parse detailed data loader performance logs."""
    
    data = defaultdict(list)
    
    with open(filename, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    # Extract all PDFView measurements
    patterns = {
        'pdfview_total': r'\[PERF\]\[PDFView\] TOTAL requestViewerState:\s*([\d.]+)\s*ms',
        'pdfview_parallel': r'\[PERF\]\[PDFView\] Parallel Promise\.all completed:\s*([\d.]+)\s*ms',
        'pdfview_getDocument': r'\[PERF\]\[PDFView\] getDocument\(\):\s*([\d.]+)\s*ms',
        'pdfview_relationTypesAPI': r'\[PERF\]\[PDFView\] relationTypesAPI\.get\(\):\s*([\d.]+)\s*ms',
        'pdfview_relationships': r'\[PERF\]\[PDFView\] relationships\.requestState\(\):\s*([\d.]+)\s*ms',
        'pdfview_referencesAPI_final': r'\[PERF\]\[PDFView\] referencesAPI\.get\(\):\s*([\d.]+)\s*ms',
        'pdfview_state_prep': r'\[PERF\]\[PDFView\] State preparation:\s*([\d.]+)\s*ms',
        
        # Detailed breakdowns
        'document_api_call': r'\[PERF\]\[Document\] Entity API call:\s*([\d.]+)\s*ms',
        'document_selection': r'\[PERF\]\[Document\] Document selection \(getEntityDoc\):\s*([\d.]+)\s*ms',
        'document_total': r'\[PERF\]\[Document\] TOTAL getDocument:\s*([\d.]+)\s*ms',
        
        'relationships_getGrouped': r'\[PERF\]\[Relationships\] getGroupedByConnection API:\s*([\d.]+)\s*ms',
        'relationships_dataProcessing': r'\[PERF\]\[Relationships\] Data processing \(template filtering, sort options\):\s*([\d.]+)\s*ms',
        'relationships_search': r'\[PERF\]\[Relationships\] connectionsListActions\.search:\s*([\d.]+)\s*ms',
        'relationships_total': r'\[PERF\]\[Relationships\] TOTAL requestState:\s*([\d.]+)\s*ms',
        
        'referencesAPI_search': r'\[PERF\]\[ReferencesAPI\] GET search:\s*([\d.]+)\s*ms',
        'referencesAPI_by_document': r'\[PERF\]\[ReferencesAPI\] GET by_document:\s*([\d.]+)\s*ms',
        'referencesAPI_group_by_connection': r'\[PERF\]\[ReferencesAPI\] GET group_by_connection:\s*([\d.]+)\s*ms',
        
        'relationTypesAPI_backend': r'\[PERF\]\[API\] GET /api/relationtypes TOTAL:\s*([\d.]+)\s*ms',
        
        'ssr_total': r'\[PERF\]\[SSR\] TOTAL SSR TIME:\s*([\d.]+)\s*ms',
    }
    
    for key, pattern in patterns.items():
        matches = re.findall(pattern, content)
        data[key] = [float(m) for m in matches]
    
    return data

def print_stats(label, values, width=40):
    """Print statistical summary."""
    if not values:
        return
    
    avg = mean(values)
    med = median(values)
    min_val = min(values)
    max_val = max(values)
    std = stdev(values) if len(values) > 1 else 0
    
    print(f"  {label:{width}} avg={avg:7.1f}ms  med={med:7.1f}ms  min={min_val:7.1f}ms  max={max_val:7.1f}ms  std=±{std:5.1f}ms  n={len(values)}")

def analyze_dataloader(data):
    """Analyze and print data loader performance breakdown."""
    
    print("=" * 100)
    print("DATA LOADER DETAILED BREAKDOWN - WHAT'S TAKING THE TIME?")
    print("=" * 100)
    
    # Top-level PDFView metrics
    print("\n### PDFView requestViewerState - TOP LEVEL ###\n")
    print_stats("TOTAL requestViewerState", data['pdfview_total'])
    print_stats("├─ Parallel Promise.all", data['pdfview_parallel'])
    print_stats("├─ Final referencesAPI.get", data['pdfview_referencesAPI_final'])
    print_stats("└─ State preparation", data['pdfview_state_prep'])
    
    # The 3 parallel operations
    print("\n### Inside Parallel Promise.all (3 operations) ###\n")
    print_stats("1. getDocument()", data['pdfview_getDocument'])
    print_stats("2. relationTypesAPI.get()", data['pdfview_relationTypesAPI'])
    print_stats("3. relationships.requestState()", data['pdfview_relationships'])
    
    # getDocument breakdown
    if data['document_total']:
        print("\n### getDocument() Breakdown ###\n")
        print_stats("TOTAL getDocument", data['document_total'])
        print_stats("├─ Entity API call", data['document_api_call'])
        print_stats("└─ Document selection (getEntityDoc)", data['document_selection'])
    
    # relationships.requestState breakdown  
    if data['relationships_total']:
        print("\n### relationships.requestState() Breakdown ###\n")
        print_stats("TOTAL requestState", data['relationships_total'])
        print_stats("├─ getGroupedByConnection API", data['relationships_getGrouped'])
        print_stats("├─ Data processing", data['relationships_dataProcessing'])
        print_stats("└─ connectionsListActions.search", data['relationships_search'])
        
        print("\n  🔴 BOTTLENECK: connectionsListActions.search takes", 
              f"{mean(data['relationships_search']):.1f}ms avg" if data['relationships_search'] else "N/A")
        print("     This is", 
              f"{mean(data['relationships_search'])/mean(data['relationships_total'])*100:.1f}%" if data['relationships_total'] and data['relationships_search'] else "N/A",
              "of relationships.requestState time!")
    
    # ReferencesAPI breakdown
    print("\n### ReferencesAPI Operations ###\n")
    print_stats("GET search (SLOWEST!)", data['referencesAPI_search'])
    print_stats("GET group_by_connection", data['referencesAPI_group_by_connection'])
    print_stats("GET by_document", data['referencesAPI_by_document'])
    
    # RelationTypesAPI
    if data['relationTypesAPI_backend']:
        print("\n### RelationTypesAPI Backend ###\n")
        print_stats("GET /api/relationtypes", data['relationTypesAPI_backend'])
    
    # Time accounting
    print("\n### TIME ACCOUNTING - Where Does The Time Go? ###\n")
    
    if data['pdfview_total']:
        total_avg = mean(data['pdfview_total'])
        parallel_avg = mean(data['pdfview_parallel']) if data['pdfview_parallel'] else 0
        references_avg = mean(data['pdfview_referencesAPI_final']) if data['pdfview_referencesAPI_final'] else 0
        state_prep_avg = mean(data['pdfview_state_prep']) if data['pdfview_state_prep'] else 0
        
        print(f"Total requestViewerState:        {total_avg:7.1f}ms (100.0%)")
        print(f"  ├─ Parallel Promise.all:       {parallel_avg:7.1f}ms ({parallel_avg/total_avg*100:5.1f}%)")
        
        if data['pdfview_getDocument']:
            getdoc_avg = mean(data['pdfview_getDocument'])
            print(f"  │  ├─ getDocument:              {getdoc_avg:7.1f}ms ({getdoc_avg/total_avg*100:5.1f}%)")
        
        if data['pdfview_relationTypesAPI']:
            reltype_avg = mean(data['pdfview_relationTypesAPI'])
            print(f"  │  ├─ relationTypesAPI:         {reltype_avg:7.1f}ms ({reltype_avg/total_avg*100:5.1f}%)")
        
        if data['pdfview_relationships']:
            rel_avg = mean(data['pdfview_relationships'])
            print(f"  │  └─ relationships.requestState: {rel_avg:7.1f}ms ({rel_avg/total_avg*100:5.1f}%)")
            
            if data['referencesAPI_search']:
                search_avg = mean(data['referencesAPI_search'])
                print(f"  │     └─ 🔴 referencesAPI.search: {search_avg:7.1f}ms ({search_avg/total_avg*100:5.1f}%) ← BIGGEST BOTTLENECK!")
        
        print(f"  ├─ Final referencesAPI.get:    {references_avg:7.1f}ms ({references_avg/total_avg*100:5.1f}%)")
        print(f"  └─ State preparation:          {state_prep_avg:7.1f}ms ({state_prep_avg/total_avg*100:5.1f}%)")
    
    # Key findings
    print("\n" + "=" * 100)
    print("KEY FINDINGS")
    print("=" * 100)
    
    if data['referencesAPI_search'] and data['pdfview_total']:
        search_avg = mean(data['referencesAPI_search'])
        total_avg = mean(data['pdfview_total'])
        pct = search_avg / total_avg * 100
        
        print(f"\n🔴 CRITICAL BOTTLENECK: referencesAPI GET /search")
        print(f"   Average time: {search_avg:.1f}ms")
        print(f"   Percentage of total data loader time: {pct:.1f}%")
        print(f"   This single API call accounts for ~{pct:.0f}% of all data loading time!")
        
    if data['pdfview_relationTypesAPI']:
        print(f"\n✓ FAST: relationTypesAPI.get()")
        print(f"   Average time: {mean(data['pdfview_relationTypesAPI']):.1f}ms ({mean(data['pdfview_relationTypesAPI'])/mean(data['pdfview_total'])*100:.1f}%)")
        
    if data['document_selection']:
        print(f"\n✓ FAST: Document selection (getEntityDoc)")
        print(f"   Average time: {mean(data['document_selection']):.1f}ms (negligible)")
    
    if data['pdfview_state_prep']:
        print(f"\n✓ FAST: State preparation")
        print(f"   Average time: {mean(data['pdfview_state_prep']):.1f}ms (negligible)")
    
    print("\n" + "=" * 100)

if __name__ == '__main__':
    import sys
    filename = sys.argv[1] if len(sys.argv) > 1 else 'perf_logs.txt'
    
    try:
        data = parse_dataloader_logs(filename)
        analyze_dataloader(data)
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
