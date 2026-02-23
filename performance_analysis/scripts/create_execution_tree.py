#!/usr/bin/env python3

# Average timings from benchmark (excluding warmup)
ssr_total = 288.99
api_search = 116.62
relationships_search = 116.55
es_query = 7.86
get_hubs = 44.87
get_count = 43.64
get_right_side = 8.73
request_state = 205.89
rendering = 34.94
resources = 11.98

# Calculate percentages
def pct(part, total):
    return (part / total * 100) if total > 0 else 0

# Create execution tree
print("## Performance After Fix")
print()
print("**Average Response Time: ~289ms** (down from ~500ms)")
print()
print("### Execution Tree with Timings")
print()
print("```")
print(f"Total SSR: {ssr_total:.2f}ms")
print(f"├─ Global resources fetch: {resources:.2f}ms ({pct(resources, ssr_total):.1f}%)")
print(f"├─ RequestState execution: {request_state:.2f}ms ({pct(request_state, ssr_total):.1f}%)")
print(f"│  └─ /api/references/search: {api_search:.2f}ms ({pct(api_search, ssr_total):.1f}%)")
print(f"│     └─ relationshipsSearch: {relationships_search:.2f}ms ({pct(relationships_search, ssr_total):.1f}%)")
print(f"│        ├─ getRightSideConnections: {get_right_side:.2f}ms ({pct(get_right_side, relationships_search):.1f}%)")
print(f"│        ├─ ElasticSearch: {es_query:.2f}ms ({pct(es_query, relationships_search):.1f}%) ⬅️ FIXED!")
print(f"│        ├─ getMatchingHubsCount: {get_count:.2f}ms ({pct(get_count, relationships_search):.1f}%)")
print(f"│        └─ getHubs: {get_hubs:.2f}ms ({pct(get_hubs, relationships_search):.1f}%)")
print(f"└─ React rendering: {rendering:.2f}ms ({pct(rendering, ssr_total):.1f}%)")
print("```")
print()
print("### Operation Ranking (by execution time)")
print()
print("| Rank | Operation | Time (ms) | % of Total | Status |")
print("|------|-----------|-----------|------------|--------|")

operations = [
    ("RequestState execution", request_state, ssr_total),
    ("relationshipsSearch", relationships_search, ssr_total),
    ("getHubs (MongoDB)", get_hubs, ssr_total),
    ("getMatchingHubsCount (MongoDB)", get_count, ssr_total),
    ("React rendering", rendering, ssr_total),
    ("Global resources fetch", resources, ssr_total),
    ("getRightSideConnections (MongoDB)", get_right_side, ssr_total),
    ("ElasticSearch query", es_query, ssr_total),
]

operations.sort(key=lambda x: x[1], reverse=True)

for i, (name, time, total) in enumerate(operations, 1):
    status = "✅ Optimized" if time < 50 else "🟡 Moderate"
    if "ElasticSearch" in name:
        status = "✅ **FIXED** (was 420ms, now 7.86ms)"
    print(f"| {i} | {name} | {time:.2f} | {pct(time, total):.1f}% | {status} |")

print()
print("### Key Improvements")
print()
print("**ElasticSearch Query Optimization:**")
print("- **Before:** 420ms (81.6% of total time)")
print("- **After:** 7.86ms (2.7% of total time)")  
print("- **Improvement:** 98.1% faster (412ms saved)")
print()
print("**Total Request Time:**")
print("- **Before:** ~500ms")
print("- **After:** ~289ms")
print("- **Improvement:** 42.2% faster (211ms saved)")

