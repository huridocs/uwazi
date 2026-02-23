# Performance Benchmark Methodology Reference

## Document Purpose

This document provides a replicable methodology for benchmarking and analyzing performance bottlenecks in the Uwazi application, specifically for the EntityView route and ElasticSearch query performance.

**Investigation Date**: February 23, 2026  
**Branch**: `perf/entityview-instrumentation`  
**Issue Reference**: GitHub #8815

---

## Executive Summary

**Problem Investigated**: EntityView route taking ~500ms per request, with ElasticSearch queries consuming 380-420ms (81.6% of total time).

**Root Cause Found**: Aggregations were running despite `performAggregations: false` being set, causing global scans of 1.7M documents and duplicate 892-ID terms queries.

**Resolution**: Fixed `performAggregations` flag handling, reducing ES query time from 420ms to ~8ms (98% improvement).

---

## Test Entities Used

### Primary Test Entity

The primary entity used for benchmarking was selected based on having the highest relationship count in the database, making it the worst-case scenario for query performance.

**Entity Details:**

```
Shared ID:     egfjcp0mp1w
Title:         Observations on communications (EN)
Language:      en
Relationships: 892 connections
Template:      [varies based on instance]
URL:           http://localhost:3000/entity/egfjcp0mp1w
```

### Additional Test Entities

These entities were identified through database queries to find entities with high relationship counts:

```javascript
// MongoDB query used to find high-relationship entities:
db.connections.aggregate([
  { $unwind: '$entity' },
  { $group: { _id: '$entity', count: { $sum: 1 } } },
  { $sort: { count: -1 } },
  { $limit: 10 },
]);
```

**Entity List:**

| Rank | Shared ID     | Title                          | Relationships | Language | Use Case                        |
| ---- | ------------- | ------------------------------ | ------------- | -------- | ------------------------------- |
| 1    | `egfjcp0mp1w` | Observations on communications | 892           | EN       | Primary benchmark (worst case)  |
| 2    | `rbft3apinse` | Observations on communications | 892           | FR       | Same entity, different language |
| 3    | `mm95ay0ix4`  | Observations on communications | 874           | ES       | Same entity, Spanish version    |
| 4    | `rfrw6wbn6d`  | Observations 2019              | 644           | EN       | Medium complexity test          |
| 5    | `4pu4bwybbwj` | Oceans and law of the sea 2018 | 469           | EN       | Lower complexity test           |
| 6    | `2rpox8umh35` | General disarmament 2001       | 468           | EN       | Similar to #5                   |
| 7    | `mcbck9t3xuj` | Oceans and law of the sea      | 442           | EN       | Moderate complexity             |
| 8    | `fqt8aa7zj5w` | Children and armed conflict    | 437           | EN       | Moderate complexity             |
| 9    | `blal00ukpl`  | Oceans 2020                    | 436           | EN       | Moderate complexity             |
| 10   | `dgkak61x7te` | Oceans 2018 v2                 | 434           | EN       | Moderate complexity             |

**Selection Criteria:**

- High relationship counts (400+ connections)
- Represents real production data patterns
- Multiple languages for translation testing
- Covers different entity templates

---

## Database State During Benchmark

### ElasticSearch Index Statistics

```bash
# Command used to capture index stats:
curl -s 'http://localhost:9200/_cat/indices?v&h=index,docs.count,store.size,pri,rep'
```

**Index State:**

```
Index Name:        uwazi_development
Document Count:    1,695,806 documents
Index Size:        7.8 GB
Primary Shards:    1
Replica Shards:    0
Segment Count:     11
Status:            Yellow (single node, no replicas)
```

### Cluster Health

```bash
# Command used:
curl -s 'http://localhost:9200/_cluster/health?pretty'
```

**Cluster Configuration:**

```json
{
  "cluster_name": "docker-cluster",
  "status": "yellow",
  "number_of_nodes": 1,
  "number_of_data_nodes": 1,
  "active_primary_shards": 500,
  "active_shards": 500
}
```

### MongoDB Statistics

```bash
# Commands used to check database size:
mongo uwazi_development --eval "db.stats()"
mongo uwazi_development --eval "db.entities.count()"
mongo uwazi_development --eval "db.connections.count()"
```

**Database State:**

- Entities collection: ~566,000 documents (varies by language)
- Connections collection: ~XXX documents
- Database size: ~XXX GB

---

## Benchmark Setup Process

### 1. Environment Preparation

**Prerequisites:**

- Node.js v16+ installed
- Yarn package manager
- MongoDB running on localhost:27017
- ElasticSearch running on localhost:9200
- Production-like dataset loaded

**Branch Setup:**

```bash
# Clone repository and checkout performance branch
git clone [repo-url] uwazi
cd uwazi
git checkout perf/entityview-instrumentation

# Install dependencies
yarn install

# Verify instrumentation is present
git log --oneline | grep "performance instrumentation"
```

**Expected Output:**

```
0befe97061 Add comprehensive performance instrumentation for EntityView route
```

### 2. Server Configuration

**Start Command:**

```bash
# Start development server with logging
yarn hot > perf_logs.txt 2>&1 &
```

**Wait for Startup:**

```bash
# Wait ~60 seconds for full initialization
sleep 60

# Verify server is ready
grep "Connected to MongoDB" perf_logs.txt
grep "webpack compiled successfully" perf_logs.txt

# Test server responds
curl -s 'http://localhost:3000' > /dev/null && echo "Server ready"
```

### 3. Instrumentation Verification

**Check Performance Logging:**

```bash
# Make a test request
curl -s 'http://localhost:3000/entity/egfjcp0mp1w' -H 'Accept: text/html' > /dev/null

# Verify [PERF] logs are generated
grep '\[PERF\]' perf_logs.txt | tail -20
```

**Expected Log Output:**

```
[PERF][RelationshipsSearch] getRightSideConnections: XX.XX ms - Connections: 892
[PERF][RelationshipsSearch] Querying ES with 892 entity IDs
[PERF][RelationshipsSearch] ElasticSearch search.search: XXX.XX ms - Results: X
[PERF][RelationshipsSearch] getMatchingHubsCount: XX.XX ms - Total hubs: X
[PERF][RelationshipsSearch] getHubs: XX.XX ms - Hubs: X
[PERF][RelationshipsSearch] TOTAL: XXX.XX ms
```

---

## Benchmark Execution Process

### Method 1: Automated Script

**Using the benchmark runner:**

```bash
# Run 5 requests to the primary test entity
./performance_analysis/scripts/run_benchmark.sh egfjcp0mp1w 5

# Run 10 requests for better averaging
./performance_analysis/scripts/run_benchmark.sh egfjcp0mp1w 10

# Test different entities
./performance_analysis/scripts/run_benchmark.sh rbft3apinse 5
./performance_analysis/scripts/run_benchmark.sh rfrw6wbn6d 5
```

**Script Output Interpretation:**

```
✅ Server is running
✅ ElasticSearch is running
📊 Index document count: 1695806

🚀 Running benchmark with 5 requests...

Request 1/5... ✅ 420ms (HTTP 200)
Request 2/5... ✅ 415ms (HTTP 200)
Request 3/5... ✅ 398ms (HTTP 200)
Request 4/5... ✅ 410ms (HTTP 200)
Request 5/5... ✅ 405ms (HTTP 200)

📊 Average ES query time: 409.60ms
⚠️  Aggregations are ENABLED (this is the bug!)
🔢 Entity IDs queried: 892
```

### Method 2: Manual Testing

**Single Request:**

```bash
# Make request and measure time
time curl -s 'http://localhost:3000/entity/egfjcp0mp1w' \
  -H 'Accept: text/html' \
  -H 'User-Agent: PerformanceBenchmark/1.0' \
  > /dev/null

# Extract timing from logs
grep "ElasticSearch search.search" perf_logs.txt | tail -1
```

**Multiple Requests with Analysis:**

```bash
# Run 10 requests with 2-second delay between each
for i in {1..10}; do
  echo "Request $i..."
  curl -s 'http://localhost:3000/entity/egfjcp0mp1w' \
    -H 'Accept: text/html' > /dev/null
  sleep 2
done

# Calculate average ES time
grep "ElasticSearch search.search" perf_logs.txt | tail -10 | \
  awk -F'[: ]' '{
    for(i=1;i<=NF;i++) {
      if($i ~ /^[0-9]+\.[0-9]+$/ && $(i+1) == "ms") {
        sum+=$i; count++
      }
    }
  } END {
    printf "Average: %.2f ms\n", sum/count
    printf "Min/Max: Check manually\n"
  }'
```

### Method 3: Load Testing

**Purpose:** Measure performance degradation under concurrent load and validate that optimizations remain effective under stress.

**Configuration:**

```javascript
// From performance_analysis/scripts/load_test.js
const CONCURRENT_REQUESTS = [1, 5, 10, 20]; // Different concurrency levels
const REQUESTS_PER_ENTITY = 3; // Requests per entity at each level
const TEST_ENTITIES = [
  { sharedId: 'egfjcp0mp1w', relationships: 892 },
  { sharedId: 'rbft3apinse', relationships: 892 },
  { sharedId: 'mm95ay0ix4', relationships: 874 },
  { sharedId: 'rfrw6wbn6d', relationships: 644 },
  { sharedId: '4pu4bwybbwj', relationships: 469 },
  { sharedId: '2rpox8umh35', relationships: 468 },
  { sharedId: 'mcbck9t3xuj', relationships: 442 },
  { sharedId: 'fqt8aa7zj5w', relationships: 437 },
  { sharedId: 'blal00ukpl', relationships: 436 },
  { sharedId: 'dgkak61x7te', relationships: 434 },
];

// Total: 120 requests (10 entities × 3 requests × 4 concurrency levels)
```

**Step 1: Run Load Test**

```bash
# Ensure server is running with performance logging
yarn hot > perf_logs_loadtest.txt 2>&1 &
sleep 60  # Wait for server to be ready

# Run the load test script
cd performance_analysis/scripts
node load_test.js

# The script will:
# - Make 120 HTTP requests total
# - Test at 4 concurrency levels: 1, 5, 10, 20
# - Hit all 10 test entities 3 times each at each level
# - Wait 2 seconds between concurrency batches
# - Print progress and timing summary
```

**Step 2: Analyze Load Test Results**

The load test script outputs a comprehensive summary showing:

- Average request time per concurrency level
- Throughput (requests per second)
- Performance degradation percentages
- Breakdown by relationship count
- Top 5 slowest requests per batch

**Step 3: Extract ElasticSearch Timings Per Concurrency Level**

```bash
# Extract all ElasticSearch query times
grep "ElasticSearch search.search" perf_logs_loadtest.txt | \
  sed -E 's/.*: ([0-9.]+) ms.*/\1/' > /tmp/es_times.txt

# Count total ES operations
wc -l /tmp/es_times.txt  # Should be 120

# Calculate averages per concurrency level using Python
cat > /tmp/calc_es_avgs.py << 'EOF'
#!/usr/bin/env python3
with open('/tmp/es_times.txt') as f:
    times = [float(line.strip()) for line in f if line.strip()]

# Split into 4 batches of 30 requests each (10 entities × 3 requests)
batch_size = 30
batches = []
for i in range(0, len(times), batch_size):
    batch = times[i:i+batch_size]
    batches.append(batch)

concurrency_levels = [1, 5, 10, 20]

print("ElasticSearch Timing Averages by Concurrency Level:")
print("=" * 60)
for i, (batch, conc) in enumerate(zip(batches, concurrency_levels)):
    avg = sum(batch) / len(batch)
    min_time = min(batch)
    max_time = max(batch)
    print(f"Concurrency {conc:2d}: avg={avg:6.2f}ms, min={min_time:6.2f}ms, max={max_time:6.2f}ms (n={len(batch)})")
EOF

python3 /tmp/calc_es_avgs.py
```

**Expected Output:**

```
ElasticSearch Timing Averages by Concurrency Level:
============================================================
Concurrency  1: avg= 26.42ms, min=  5.26ms, max=209.36ms (n=30)
Concurrency  5: avg= 25.18ms, min=  6.14ms, max= 80.70ms (n=30)
Concurrency 10: avg= 40.01ms, min= 15.48ms, max= 69.13ms (n=30)
Concurrency 20: avg= 74.64ms, min= 22.19ms, max=124.50ms (n=30)
```

**Step 4: Analyze Load Test with Python Script**

```bash
cd performance_analysis/scripts
python3 analyze_load_test.py ../../perf_logs_loadtest.txt

# This generates comprehensive analysis including:
# - Request timing distributions
# - Throughput calculations
# - Degradation percentages
# - Performance by entity relationship count
```

**Load Testing Best Practices:**

1. **Server State:**

   - Ensure server has been running for at least 60 seconds before testing
   - No other heavy operations running concurrently
   - Database connections warmed up

2. **Batch Separation:**

   - 2-second wait between concurrency levels lets server recover
   - Prevents connection pool exhaustion from affecting results

3. **Result Interpretation:**

   - Compare ElasticSearch degradation vs overall degradation
   - If ES degrades less than overall, bottleneck is elsewhere (MongoDB, connection pooling)
   - Look for outliers (may indicate cache misses or GC pauses)

4. **Replication:**
   - Run load test multiple times and average results
   - Note time of day (affects server load if shared environment)
   - Document database size and connection pool settings

---

## Performance Metrics Collection

### Primary Metrics

**1. ElasticSearch Query Time**

```bash
# Extract ES query times
grep "ElasticSearch search.search" perf_logs.txt | \
  awk -F'[: ]' '{
    for(i=1;i<=NF;i++) {
      if($i ~ /^[0-9]+\.[0-9]+$/ && $(i+1) == "ms") print $i
    }
  }'
```

**2. Total Request Time**

```bash
# Extract total relationshipsSearch time
grep "RelationshipsSearch] TOTAL:" perf_logs.txt | \
  awk '{print $4}'
```

**3. Component Breakdown**

```bash
# Get timing for all components
grep '\[PERF\]\[RelationshipsSearch\]' perf_logs.txt | tail -20
```

### Secondary Metrics

**MongoDB Operations:**

```bash
grep "getRightSideConnections\|getHubs\|getMatchingHubsCount" perf_logs.txt | tail -10
```

**Entity Counts:**

```bash
grep "Connections:\|Results:\|Hubs:" perf_logs.txt | tail -10
```

---

## Data Analysis Process

### Step 1: Extract Raw Metrics

**Create a metrics file:**

```bash
# Extract all ES query times to CSV
echo "request_num,es_time_ms,results_count" > metrics.csv
grep "ElasticSearch search.search" perf_logs.txt | \
  awk -F'[: ]' '{
    for(i=1;i<=NF;i++) {
      if($i ~ /^[0-9]+\.[0-9]+$/ && $(i+1) == "ms") time=$i
      if($(i-1) == "Results:") results=$i
    }
    print NR","time","results
  }' >> metrics.csv
```

### Step 2: Calculate Statistics

**Using the analysis script:**

```bash
cd performance_analysis/scripts
python3 analyze_backend.py ../../perf_logs.txt > analysis_report.txt
```

**Manual calculation:**

```bash
# Average
awk -F',' 'NR>1 {sum+=$2; count++} END {print "Average:", sum/count, "ms"}' metrics.csv

# Min/Max
awk -F',' 'NR>1 {print $2}' metrics.csv | sort -n | head -1  # Min
awk -F',' 'NR>1 {print $2}' metrics.csv | sort -n | tail -1  # Max

# Percentiles (requires GNU datamash)
awk -F',' 'NR>1 {print $2}' metrics.csv | datamash median 1 q1 1 q3 1 perc:95 1
```

### Step 3: Component Analysis

**Breakdown by operation:**

```bash
# Create operation timing summary
echo "Operation,Avg_Time_ms,Percentage" > breakdown.csv

# ES queries
ES_AVG=$(grep "ElasticSearch search.search" perf_logs.txt | tail -10 | \
  awk '{sum+=$6; count++} END {print sum/count}')

# MongoDB ops
MONGO_AVG=$(grep "getHubs\|getMatchingHubsCount" perf_logs.txt | tail -20 | \
  awk '{sum+=$4; count++} END {print sum/count}')

# Calculate percentages
TOTAL=$(echo "$ES_AVG + $MONGO_AVG" | bc)
ES_PCT=$(echo "scale=2; $ES_AVG / $TOTAL * 100" | bc)

echo "ElasticSearch,$ES_AVG,$ES_PCT%" >> breakdown.csv
```

---

## Advanced Investigation Techniques

### 1. ElasticSearch Query Profiling

**Enable profiling in code:**

```javascript
// In app/api/search/search.js
const searchParams = { body: esQuery };
if (query.ids && query.ids.length > 100) {
  searchParams.body.profile = true; // Enable ES profiling
}
```

**Extract profile data:**

```bash
grep '\[PERF\]\[ES-PROFILE\]' perf_logs.txt | tail -50
```

**Profile output interpretation:**

```
[PERF][ES-PROFILE] Shard 0:
[PERF][ES-PROFILE]   Query time: 155.45 ms
[PERF][ES-PROFILE]     - FieldExistsQuery: 29.79 ms      (19%)
[PERF][ES-PROFILE]     - BooleanQuery: 23.61 ms          (15%)
[PERF][ES-PROFILE]     - MatchAllDocsQuery: 27.39 ms     (18%)
```

### 2. Query Structure Analysis

**Log full query:**

```javascript
// In app/api/search/search.js
if (query.ids && query.ids.length > 100) {
  console.log('[PERF][ES-QUERY] Full query:', JSON.stringify(esQuery, null, 2));
}
```

**Extract query structure:**

```bash
grep -A200 '\[PERF\]\[ES-QUERY\] Full query:' perf_logs.txt > es_query.json
```

### 3. ID Count Scaling Test

**Test with varying ID counts:**

```bash
# Test with 50 IDs
TEST_ID_COUNT=50 yarn hot > perf_50ids.txt 2>&1 &
sleep 60
curl -s 'http://localhost:3000/entity/egfjcp0mp1w' > /dev/null
grep "ElasticSearch search.search" perf_50ids.txt | tail -1

# Test with 200 IDs
pkill -f "node.*hot"
TEST_ID_COUNT=200 yarn hot > perf_200ids.txt 2>&1 &
sleep 60
curl -s 'http://localhost:3000/entity/egfjcp0mp1w' > /dev/null
grep "ElasticSearch search.search" perf_200ids.txt | tail -1

# Compare scaling
echo "50 IDs:" $(grep "ElasticSearch search.search" perf_50ids.txt | tail -1)
echo "200 IDs:" $(grep "ElasticSearch search.search" perf_200ids.txt | tail -1)
echo "892 IDs:" $(grep "ElasticSearch search.search" perf_logs.txt | tail -1)
```

---

## Benchmark Results Documentation

### Original Bottleneck (Before Fix)

**Test Configuration:**

- Entity: `egfjcp0mp1w` (892 relationships)
- Index: 1,695,806 documents
- Date: February 23, 2026

**Results:**

```
Total Request Time:        ~500ms
├─ ElasticSearch:          420ms (84.0%)
│  ├─ Aggregations:        ~260ms (60-70% of ES)
│  ├─ Terms Query:         ~100ms (20-30% of ES)
│  └─ Other:               ~60ms (10% of ES)
├─ MongoDB getHubs:        46ms (9.2%)
├─ MongoDB getCount:       49ms (9.8%)
└─ Other Operations:       ~35ms (7.0%)

ElasticSearch Query Details:
- Terms queried:           892 entity IDs
- Results returned:        0 documents
- Aggregations run:        YES (bug - should be NO)
- Global aggregation:      Scanned 1.7M documents
- Query size requested:    9999 documents
```

**Key Finding:**
The `performAggregations: false` flag was not preventing aggregations from running, causing:

1. Global aggregation scanning all 1.7M documents
2. Duplicate 892-ID terms query inside aggregations
3. 260ms wasted on unnecessary aggregation processing

### After Fix

**Test Configuration:**

- Same entity, same database state
- Fix applied: Respect `performAggregations: false` flag

**Results:**

```
Total Request Time:        ~115ms
├─ ElasticSearch:          8ms (7.0%)
├─ MongoDB getHubs:        45ms (39.1%)
├─ MongoDB getCount:       42ms (36.5%)
└─ Other Operations:       ~20ms (17.4%)

Improvement:
- Total time: 500ms → 115ms (77% faster)
- ES time: 420ms → 8ms (98% faster)
- Primary bottleneck eliminated
```

### Load Testing Results (After Fix)

**Test Configuration:**

- Total requests: 120 (10 entities × 3 requests × 4 concurrency levels)
- Concurrency levels: 1, 5, 10, 20
- Test entities: All 10 entities with 434-892 relationships
- Database state: 1,695,806 documents in ElasticSearch
- Date: February 23, 2026

**Overall Performance by Concurrency:**

| Concurrency | Avg Response | Throughput | Degradation | ElasticSearch Avg |
| ----------- | ------------ | ---------- | ----------- | ----------------- |
| 1           | 325ms        | 3.07 rps   | Baseline    | 26.42ms           |
| 5           | 713ms        | 5.88 rps   | +119%       | 25.18ms (-4.7%)   |
| 10          | 1,337ms      | 6.28 rps   | +311%       | 40.01ms (+51%)    |
| 20          | 2,303ms      | 6.12 rps   | +609%       | 74.64ms (+183%)   |

**Key Findings:**

1. **ElasticSearch Remains Fast Under Load:**

   - At concurrency 1: 26.42ms average (vs 411ms before fix)
   - At concurrency 20: 74.64ms average (still 82% faster than original)
   - ES is no longer the bottleneck, even under heavy load

2. **Overall System Degradation:**

   - Response times increase by 6x at concurrency 20
   - Suggests bottlenecks in MongoDB aggregations or connection pooling
   - Peak throughput: ~6.3 requests/second at concurrency 10

3. **ElasticSearch Scaling:**
   - Concurrency 1→5: ES time stays flat (-4.7%)
   - Concurrency 5→10: ES time increases +58.9%
   - Concurrency 10→20: ES time increases +86.6%
   - Much better scaling than before fix (was linear with aggregations)

**Performance by Entity Relationship Count:**

```
Concurrency 1:
  892 relationships: avg=410ms, min=297ms, max=568ms
  644 relationships: avg=338ms, min=295ms, max=401ms
  469 relationships: avg=277ms, min=256ms, max=318ms
  434 relationships: avg=265ms, min=252ms, max=291ms

Concurrency 20:
  892 relationships: avg=2,584ms, min=2,012ms, max=3,287ms
  644 relationships: avg=2,389ms, min=1,892ms, max=2,956ms
  469 relationships: avg=2,112ms, min=1,756ms, max=2,498ms
  434 relationships: avg=2,053ms, min=1,687ms, max=2,411ms
```

**Comparison to Pre-Fix Performance:**

| Metric          | Before Fix | After Fix (C=1) | Improvement |
| --------------- | ---------- | --------------- | ----------- |
| Total SSR       | 665ms      | 325ms           | **-51.1%**  |
| ElasticSearch   | 411ms      | 26.42ms         | **-93.6%**  |
| Peak throughput | ~1.5 rps   | 6.28 rps        | **+318%**   |

**Implications for Production:**

- ✅ System can handle moderate concurrent load (5-10 requests/sec)
- ✅ ElasticSearch optimization holds up under stress
- ⚠️ MongoDB aggregations show performance impact under high concurrency
- ⚠️ Connection pooling may need tuning for >10 concurrent requests
- ✅ Acceptable performance for typical production usage patterns

---

## Reproducing This Benchmark in the Future

### For New Performance Issues

**1. Identify high-impact entities:**

```javascript
// In MongoDB shell
db.connections.aggregate([
  { $unwind: '$entity' },
  { $group: { _id: '$entity', count: { $sum: 1 } } },
  { $sort: { count: -1 } },
  { $limit: 20 },
]);
```

**2. Add performance instrumentation:**

```javascript
// Template for new instrumentation
const start = performance.now();
// ... operation to measure ...
console.log(
  '[PERF][Component] operation:',
  (performance.now() - start).toFixed(2),
  'ms',
  '- metric:',
  value
);
```

**3. Run standardized benchmark:**

```bash
# Use the benchmark script
./performance_analysis/scripts/run_benchmark.sh <sharedId> 10

# Or create new benchmark suite
cd performance_analysis/scripts
node load_test.js
```

**4. Document findings:**

```markdown
## Performance Issue: [Title]

- Date: YYYY-MM-DD
- Entity: <sharedId> (X relationships)
- Total time: Xms
- Bottleneck: Component (XX%)
- Root cause: [Description]
- Fix applied: [Description]
- Results: Xms → Yms (Z% improvement)
```

### For Regression Testing

**Create baseline measurements:**

```bash
# Capture baseline performance
./performance_analysis/scripts/run_benchmark.sh egfjcp0mp1w 20 > baseline_$(date +%Y%m%d).txt

# After changes, compare
./performance_analysis/scripts/run_benchmark.sh egfjcp0mp1w 20 > after_$(date +%Y%m%d).txt

# Diff the results
diff -u baseline_*.txt after_*.txt
```

### For Scaling Analysis

**Test with increasing load:**

```bash
# Test entities with different relationship counts
for entity in egfjcp0mp1w rfrw6wbn6d 4pu4bwybbwj; do
  echo "Testing $entity..."
  ./performance_analysis/scripts/run_benchmark.sh $entity 5
done

# Compare results
grep "Average ES query time" *.txt
```

---

## Tools and Scripts Reference

### Benchmark Scripts

| Script                 | Purpose                 | Usage                                   |
| ---------------------- | ----------------------- | --------------------------------------- |
| `run_benchmark.sh`     | Single entity benchmark | `./run_benchmark.sh <id> <count>`       |
| `load_test.js`         | Concurrent load testing | `node load_test.js`                     |
| `analyze_backend.py`   | Log analysis            | `python3 analyze_backend.py logs.txt`   |
| `analyze_load_test.py` | Load test analysis      | `python3 analyze_load_test.py logs.txt` |

### Helper Commands

**Quick metrics extraction:**

```bash
# Average ES time
alias es_avg='grep "ElasticSearch search.search" perf_logs.txt | tail -10 | awk "{sum+=\$6; count++} END {print sum/count}"'

# Request count
alias req_count='grep "ElasticSearch search.search" perf_logs.txt | wc -l'

# Latest timing
alias last_time='grep "RelationshipsSearch] TOTAL:" perf_logs.txt | tail -1'
```

**Performance monitoring:**

```bash
# Tail logs with filtering
tail -f perf_logs.txt | grep '\[PERF\]'

# Watch ES query times in real-time
watch -n 2 'grep "ElasticSearch search.search" perf_logs.txt | tail -5'
```

---

## Troubleshooting

### Common Issues

**1. Different performance numbers**

- Cause: Database state differs (more/fewer documents)
- Solution: Document current index size when benchmarking
- Command: `curl 'http://localhost:9200/_cat/indices?v'`

**2. Instrumentation not appearing**

- Cause: Wrong branch or code not compiled
- Solution: Verify branch and restart server
- Commands:
  ```bash
  git branch --show-current  # Should be perf/entityview-instrumentation
  grep "\[PERF\]" app/api/relationships/relationshipsSearch.js
  pkill -f "node.*hot" && yarn hot > perf_logs.txt 2>&1 &
  ```

**3. Entity not found (404)**

- Cause: Database doesn't have the test entity
- Solution: Query ES for available entities
- Command:
  ```bash
  curl 'http://localhost:9200/uwazi_development/_search?pretty' \
    -d '{"size": 1, "query": {"match_all": {}}}' | \
    grep sharedId
  ```

**4. Inconsistent timings**

- Cause: Cache warming, background processes
- Solution: Run multiple requests and average
- Best practice: Discard first 2-3 requests, average next 10

---

## Appendix: File Locations

### Instrumented Files

- `app/api/relationships/relationshipsSearch.js` - Main search function
- `app/api/relationships/relationships.js` - MongoDB operations
- `app/api/search/search.js` - ElasticSearch queries
- `app/api/entities/entities.js` - Entity operations
- `app/react/Viewer/EntityView.js` - Frontend component

### Analysis Scripts

- `performance_analysis/scripts/run_benchmark.sh` - Automated benchmark
- `performance_analysis/scripts/load_test.js` - Load testing
- `performance_analysis/scripts/analyze_backend.py` - Log analysis
- `performance_analysis/scripts/analyze_load_test.py` - Load analysis

### Documentation

- `performance_analysis/BENCHMARK_METHODOLOGY.md` - This document
- `performance_analysis/BOTTLENECK_INVESTIGATION.md` - Detailed findings
- `performance_analysis/QUICKSTART.md` - Quick reference
- `performance_analysis/README.md` - Overview

### Generated Files

- `perf_logs.txt` - Server logs with performance data
- `metrics.csv` - Extracted timing data
- `breakdown.csv` - Component timing breakdown
- `es_query.json` - Sample ElasticSearch query

---

## Version History

| Date       | Version | Changes                                                         |
| ---------- | ------- | --------------------------------------------------------------- |
| 2026-02-23 | 1.0     | Initial methodology documentation                               |
| 2026-02-23 | 1.1     | Added comprehensive load testing methodology and results        |
|            |         | Added ElasticSearch timing extraction per concurrency level     |
|            |         | Added load testing best practices and interpretation guidelines |

---

## Authors & Contributors

- Investigation lead: [Name]
- Branch: `perf/entityview-instrumentation`
- Related issue: GitHub #8815
