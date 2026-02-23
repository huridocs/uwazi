# Search Performance Benchmark Guide

This guide covers benchmarking **search query performance** in Uwazi, measuring how ElasticSearch handles text search queries with varying complexity.

---

## 🎯 Purpose

Unlike the entity-based benchmarks (which test relationship queries), search benchmarks measure:

- **Full-text search performance** - Searching document content and metadata
- **Query complexity impact** - Simple terms vs boolean operators vs wildcards
- **Result set size impact** - Common terms (many results) vs rare terms (few results)
- **Concurrent search load** - Multiple users searching simultaneously
- **Query type selection** - `query_string` (advanced) vs `simple_query_string` (fallback)

---

## 🚀 Quick Start

### 1. Simple Search Benchmark

Test a single search term multiple times:

```bash
# Start server with logging
yarn hot > perf_logs.txt 2>&1 &
sleep 60

# Run search benchmark (5 requests for "human rights")
./performance_analysis/scripts/run_search_benchmark.sh "human rights" 5
```

### 2. Comprehensive Load Test

Test multiple search queries at different concurrency levels:

```bash
# Start server with logging
yarn hot > perf_logs.txt 2>&1 &
sleep 60

# Run comprehensive search load test
cd performance_analysis/scripts
node search_load_test.js
```

This runs:

- **10 different search queries** (varying complexity)
- **3 requests per query**
- **4 concurrency levels** (1, 5, 10, 20)
- **120 total requests**

---

## 📊 What Gets Measured

### Primary Metrics

1. **ElasticSearch Query Time**

   - Raw ES search operation time
   - Logged as: `[PERF][ES] search.search: XXX.XX ms`

2. **Total Request Time**

   - End-to-end API response time
   - Includes network, parsing, and processing

3. **Result Count**

   - Number of documents returned
   - Higher counts may correlate with slower queries

4. **Query Type**
   - `query_string` - Advanced syntax (AND, OR, NOT, wildcards)
   - `simple_query_string` - Fallback for invalid syntax

### Secondary Metrics

- **Query validation time** - Time to validate query syntax
- **Full-text search time** - If searching PDF content
- **Aggregation time** - If filters are applied
- **Highlighting time** - For snippet generation

---

## 🔍 Test Search Queries

### Low Complexity (Simple Terms)

```bash
# Single word
./performance_analysis/scripts/run_search_benchmark.sh "resolution" 5

# Two words (implicit AND)
./performance_analysis/scripts/run_search_benchmark.sh "human rights" 5

# Three words
./performance_analysis/scripts/run_search_benchmark.sh "security council resolution" 5
```

**Expected Performance**: 10-50ms ES query time

### Medium Complexity (Phrases & Operators)

```bash
# Exact phrase
./performance_analysis/scripts/run_search_benchmark.sh '"general assembly"' 5

# Boolean AND
./performance_analysis/scripts/run_search_benchmark.sh "climate AND change" 5

# Boolean OR
./performance_analysis/scripts/run_search_benchmark.sh "war OR conflict OR violence" 5
```

**Expected Performance**: 20-100ms ES query time

### High Complexity (Advanced Queries)

```bash
# Complex boolean with grouping
./performance_analysis/scripts/run_search_benchmark.sh "United Nations AND (peacekeeping OR humanitarian)" 5

# Boolean NOT
./performance_analysis/scripts/run_search_benchmark.sh "disarmament AND NOT nuclear" 5

# Wildcard search
./performance_analysis/scripts/run_search_benchmark.sh "women* AND children" 5

# Full-text only search
./performance_analysis/scripts/run_search_benchmark.sh "fullText:(international humanitarian law)" 5
```

**Expected Performance**: 50-200ms ES query time

---

## 📈 Running the Comprehensive Load Test

### Configuration

The load test (`search_load_test.js`) includes 10 predefined search queries:

```javascript
const TEST_SEARCHES = [
  { term: 'human rights', complexity: 'low' },
  { term: 'security council resolution', complexity: 'low' },
  { term: '"general assembly"', complexity: 'medium' },
  { term: 'climate AND change', complexity: 'medium' },
  { term: 'war OR conflict OR violence', complexity: 'medium' },
  { term: 'United Nations AND (peacekeeping OR humanitarian)', complexity: 'high' },
  { term: 'disarmament AND NOT nuclear', complexity: 'high' },
  { term: 'fullText:(international humanitarian law)', complexity: 'high' },
  { term: 'women* AND children', complexity: 'high' },
  { term: 'treaty', complexity: 'low' },
];
```

### Running the Test

```bash
# Standard test (10 queries, 3 iterations each, 4 concurrency levels)
cd performance_analysis/scripts
node search_load_test.js

# Extended test with additional queries (15 total queries)
USE_ALL_SEARCHES=true node search_load_test.js
```

### Output Interpretation

**Progress Output:**

```
[10.0%] Request 12/120 completed: "climate AND change" (45ms, 123 results)
[20.0%] Request 24/120 completed: "treaty" (28ms, 456 results)
```

**Performance Summary:**

```
--- Concurrency: 1 ---
Total batch time: 1250ms
Average request time: 41.67ms
Requests per second: 24.00

Performance by search complexity:
  LOW   : avg=35ms, min=20ms, max=55ms (n=18)
  MEDIUM: avg=48ms, min=30ms, max=80ms (n=9)
  HIGH  : avg=65ms, min=40ms, max=120ms (n=9)

Top 5 slowest searches:
  1. "fullText:(international humanitarian law)" (high): 120ms (42 results)
  2. "United Nations AND (peacekeeping OR humanitarian)" (high): 95ms (234 results)
  3. "women* AND children" (high): 88ms (567 results)
```

**Concurrency Comparison:**

```
Concurrency | Avg Time | Throughput | Degradation
-----------+----------+------------+-------------
         1  |     42ms |   24.00 rps | +0.0%
         5  |     68ms |   23.50 rps | +61.9%
        10  |    125ms |   22.40 rps | +197.6%
        20  |    245ms |   20.80 rps | +483.3%
```

---

## 🔬 Advanced Analysis

### 1. Extract ElasticSearch Timings

```bash
# Get ES query times from logs
grep "ElasticSearch search.search" perf_logs.txt | \
  awk -F'[: ]' '{
    for(i=1;i<=NF;i++) {
      if($i ~ /^[0-9]+\.[0-9]+$/ && $(i+1) == "ms") print $i
    }
  }' > es_search_times.txt

# Calculate statistics
awk '{sum+=$1; count++; if(NR==1 || $1<min) min=$1; if(NR==1 || $1>max) max=$1}
     END {print "Avg:", sum/count, "ms\nMin:", min, "ms\nMax:", max, "ms"}' \
     es_search_times.txt
```

### 2. Compare Query Types

```bash
# Count query_string vs simple_query_string usage
echo "Query type distribution:"
grep "Using search type:" perf_logs.txt | \
  awk '{print $NF}' | sort | uniq -c

# Example output:
#  89 query_string
#  31 simple_query_string
```

### 3. Analyze by Result Count

```bash
# Extract ES time and result count
grep "ElasticSearch search.search" perf_logs.txt | \
  awk -F'[: ]' '{
    for(i=1;i<=NF;i++) {
      if($i ~ /^[0-9]+\.[0-9]+$/ && $(i+1) == "ms") time=$i
      if($(i-1) == "Results:") results=$i
    }
    print results","time
  }' > results_vs_time.csv

# Analyze correlation with Python
python3 << 'EOF'
import csv
data = []
with open('results_vs_time.csv') as f:
    for line in f:
        if line.strip():
            results, time = line.strip().split(',')
            data.append((int(results), float(time)))

# Group by result buckets
buckets = {'0-10': [], '11-50': [], '51-100': [], '100+': []}
for results, time in data:
    if results <= 10:
        buckets['0-10'].append(time)
    elif results <= 50:
        buckets['11-50'].append(time)
    elif results <= 100:
        buckets['51-100'].append(time)
    else:
        buckets['100+'].append(time)

print("Average ES time by result count:")
for bucket, times in buckets.items():
    if times:
        avg = sum(times) / len(times)
        print(f"  {bucket:8} results: {avg:6.2f}ms (n={len(times)})")
EOF
```

### 4. Profile Full-Text Search

If your searches include `fullText:()` syntax:

```bash
# Extract full-text search timing
grep "Full-text\|fullText" perf_logs.txt | grep "\[PERF\]"

# Compare full-text vs metadata-only searches
echo "Full-text search times:"
grep "fullText:(" perf_logs.txt -A 2 | grep "ElasticSearch search.search"

echo "Metadata-only search times:"
grep -v "fullText:(" perf_logs.txt | grep "ElasticSearch search.search" | head -10
```

---

## 📋 Test Scenarios

### Scenario 1: Common vs Rare Terms

Test how result count impacts performance:

```bash
# Common term (expected: many results, potentially slower)
./performance_analysis/scripts/run_search_benchmark.sh "resolution" 10

# Rare term (expected: few results, potentially faster)
./performance_analysis/scripts/run_search_benchmark.sh "cybersecurity" 10

# Very specific (expected: very few results, fast)
./performance_analysis/scripts/run_search_benchmark.sh "S/RES/2024/1234" 10
```

### Scenario 2: Boolean Complexity

Test impact of boolean operators:

```bash
# No operators (implicit AND between words)
./performance_analysis/scripts/run_search_benchmark.sh "human rights violations" 10

# Explicit AND (same semantic meaning)
./performance_analysis/scripts/run_search_benchmark.sh "human AND rights AND violations" 10

# OR operators (broader search, more results)
./performance_analysis/scripts/run_search_benchmark.sh "human OR rights OR violations" 10

# Complex nested query
./performance_analysis/scripts/run_search_benchmark.sh "(human AND rights) OR (civil AND liberties)" 10
```

### Scenario 3: Wildcard Impact

Test wildcard performance:

```bash
# No wildcards
./performance_analysis/scripts/run_search_benchmark.sh "development" 10

# Suffix wildcard
./performance_analysis/scripts/run_search_benchmark.sh "develop*" 10

# Multiple wildcards
./performance_analysis/scripts/run_search_benchmark.sh "dev*ment" 10
```

### Scenario 4: Phrase Matching

Test exact phrase vs word proximity:

```bash
# Individual words (implicit AND)
./performance_analysis/scripts/run_search_benchmark.sh "general assembly" 10

# Exact phrase
./performance_analysis/scripts/run_search_benchmark.sh '"general assembly"' 10

# Phrase with wildcard
./performance_analysis/scripts/run_search_benchmark.sh '"general * assembly"' 10
```

---

## 🎯 Baseline Performance Expectations

Based on a database with ~1.7M documents:

| Search Type        | Complexity | Expected ES Time | Expected Results |
| ------------------ | ---------- | ---------------- | ---------------- |
| Single common word | Low        | 15-40ms          | 500-5000         |
| Two-word phrase    | Low        | 20-50ms          | 100-1000         |
| Boolean AND        | Medium     | 30-80ms          | 50-500           |
| Boolean OR         | Medium     | 40-100ms         | 1000-10000       |
| Wildcard           | High       | 50-150ms         | Varies           |
| Complex boolean    | High       | 60-200ms         | 10-1000          |
| Full-text only     | High       | 100-300ms        | 10-500           |

**Note**: These are approximate ranges. Actual performance depends on:

- Index size and shard configuration
- Hardware (CPU, RAM, disk I/O)
- Result count (more results = more processing)
- Cache state (first query vs repeated queries)

---

## 🐛 Troubleshooting

### Issue: Very slow searches (>500ms)

**Possible causes:**

1. **Index not optimized** - Run ES optimization
2. **Too many results** - Add filters to narrow results
3. **Wildcard at start** - `*term` is very slow, avoid if possible
4. **Complex nested booleans** - Simplify query structure

**Debug steps:**

```bash
# Check index health
curl 'http://localhost:9200/_cluster/health?pretty'

# Check index stats
curl 'http://localhost:9200/uwazi_development/_stats?pretty'

# Force merge segments (reduces search time)
curl -XPOST 'http://localhost:9200/uwazi_development/_forcemerge?max_num_segments=1'
```

### Issue: Inconsistent timing

**Possible causes:**

1. **First query slower** - Cache warming effect
2. **Background operations** - ES is reindexing or optimizing
3. **Different result counts** - Varying query complexity

**Solutions:**

```bash
# Run warmup queries first
for i in {1..5}; do
  curl -s "http://localhost:3000/api/search?searchTerm=test" > /dev/null
done

# Then run actual benchmark
./performance_analysis/scripts/run_search_benchmark.sh "your search" 10
```

### Issue: Query syntax errors

**Symptom**: Searches return 0 results or fall back to `simple_query_string`

**Check logs for:**

```bash
grep "Query validation result: valid: false" perf_logs.txt
```

**Common syntax issues:**

- Unbalanced quotes: `"general assembly`
- Invalid operators: `general assembly || resolution`
- Invalid field names: `nonexistent_field:value`

**Solution**: Use simpler syntax or properly escape special characters

---

## 📊 Performance Comparison: Entity vs Search Benchmarks

| Aspect              | Entity Benchmark                    | Search Benchmark                |
| ------------------- | ----------------------------------- | ------------------------------- |
| **What it tests**   | Relationship queries (by entity ID) | Full-text search queries        |
| **Primary API**     | `/entity/{id}`                      | `/api/search?searchTerm=...`    |
| **ES Operation**    | Terms query (exact ID match)        | Query string (full-text search) |
| **Complexity**      | Number of relationships             | Query syntax complexity         |
| **Typical Time**    | 50-150ms (after fix)                | 20-200ms (varies by query)      |
| **Main Bottleneck** | MongoDB aggregations                | ES query parsing & matching     |
| **Use Case**        | Loading entity detail pages         | Library search functionality    |

---

## 💡 Tips for Optimal Search Performance

1. **Use specific terms** - More specific = fewer results = faster
2. **Avoid leading wildcards** - `*term` is much slower than `term*`
3. **Use filters** - Combine search with template/date filters
4. **Prefer AND over OR** - OR queries check more documents
5. **Cache common searches** - Implement Redis caching for popular queries
6. **Monitor result counts** - Queries returning >1000 results may need refinement

---

## 🔗 Related Documentation

- [Entity Benchmark Guide](./QUICKSTART.md) - For relationship query benchmarks
- [Full Methodology](./BENCHMARK_METHODOLOGY.md) - Complete benchmarking process
- [Backend Analysis](../reports/backend_bottleneck_analysis.md) - Detailed findings

---

## 📝 Recording Your Results

When documenting search performance issues, include:

```markdown
## Search Performance Issue

**Date:** YYYY-MM-DD
**Index Size:** X.X GB, XXX,XXX documents
**Search Query:** "your search term here"
**Query Complexity:** Low/Medium/High
**Result Count:** XXX documents
**ES Query Time:** XXXms
**Total Request Time:** XXXms
**Query Type:** query_string / simple_query_string
**Concurrency Level:** X requests/second

**Performance Breakdown:**

- Query validation: XXms
- ES search: XXms
- Result processing: XXms
- Total: XXms

**Root Cause:** [Description]
**Fix Applied:** [Description]
**Results After Fix:** XXms (XX% improvement)
```

---

## 🚀 Next Steps

After running benchmarks:

1. **Analyze the results** - Identify slow queries
2. **Profile ElasticSearch** - Use ES profiling API for detailed breakdown
3. **Optimize queries** - Rewrite slow queries with better syntax
4. **Add caching** - Cache frequent searches
5. **Index tuning** - Adjust ES settings for better performance
6. **Monitor production** - Set up alerts for slow searches

---

**Questions or issues?** See [GitHub Issue #8815](https://github.com/huridocs/uwazi/issues/8815)
