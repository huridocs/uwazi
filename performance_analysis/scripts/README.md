# Performance Analysis Scripts

This directory contains scripts for benchmarking and analyzing the performance of the Uwazi EntityView route and related components.

## Scripts Overview

### 1. `run_benchmark.sh`

**Purpose:** Automated benchmark runner for single entity performance testing.

**Usage:**

```bash
# Basic usage (5 requests to default entity)
./run_benchmark.sh

# Custom entity and request count
./run_benchmark.sh egfjcp0mp1w 10

# Syntax
./run_benchmark.sh [SHARED_ID] [NUM_REQUESTS]
```

**What it does:**

1. Validates server is running
2. Checks ElasticSearch health
3. Makes N HTTP requests to the entity
4. Extracts performance metrics from logs
5. Calculates averages and statistics

**Output:**

```
Starting performance benchmark...
Entity: egfjcp0mp1w
Requests: 10

Making 10 requests...
Request 1/10 completed
...

Results:
Average ES query time: 26.42ms
Min: 5.26ms
Max: 209.36ms
```

**Requirements:**

- Server running with performance logging enabled
- ElasticSearch accessible at `localhost:9200`
- Valid entity shared ID

---

### 2. `load_test.js`

**Purpose:** Load testing script to measure performance under concurrent load.

**Usage:**

```bash
# Run with default configuration
node load_test.js

# Configuration in script:
# - Concurrency levels: 1, 5, 10, 20
# - Requests per entity: 3
# - Test entities: 10 entities with 434-892 relationships
```

**What it does:**

1. Makes 120 HTTP requests total (10 entities × 3 requests × 4 concurrency levels)
2. Tests at progressively higher concurrency levels
3. Waits 2 seconds between batches for server recovery
4. Calculates response times, throughput, and degradation percentages
5. Shows performance breakdown by relationship count

**Output:**

```
Entity Performance Load Test
============================
Server: http://localhost:3000
Entities to test: 10
Requests per entity: 3
Concurrency levels: 1, 5, 10, 20
Total requests: 120

================================================================================
Starting batch with concurrency: 1
================================================================================
[0.8%] Request 1/120 completed: egfjcp0mp1w (325ms)
...

Batch completed in 9756ms

--- Concurrency: 1 ---
Total batch time: 9756ms
Average request time: 325.20ms
Requests per second: 3.07

Performance by relationship count:
  892 relationships: avg=410ms, min=297ms, max=568ms
  ...

================================================================================
CONCURRENCY COMPARISON
================================================================================
Concurrency | Avg Time | Throughput | Degradation
-----------------------------------------------------------
          1 |    325ms |   3.07 rps | +0.0%
          5 |    713ms |   5.88 rps | +119.3%
         10 |   1337ms |   6.28 rps | +311.1%
         20 |   2303ms |   6.12 rps | +608.5%
```

**Requirements:**

- Server running with performance logging
- All test entities exist in database
- Sufficient server resources to handle concurrent load

**Configuration:**

Modify these constants in the script to customize:

```javascript
const HOST = 'localhost';
const PORT = 3000;
const CONCURRENT_REQUESTS = [1, 5, 10, 20]; // Concurrency levels to test
const REQUESTS_PER_ENTITY = 3; // Requests per entity per level
```

---

### 3. `analyze_backend.py`

**Purpose:** Analyzes backend performance logs to extract timing metrics.

**Usage:**

```bash
python3 analyze_backend.py ../data/perf_logs.txt
```

**What it does:**

1. Parses `[PERF]` log entries
2. Extracts timing data for all instrumented operations
3. Calculates statistics (avg, min, max, percentiles)
4. Groups by operation type
5. Identifies bottlenecks

**Output:**

```
Backend Performance Analysis
============================

ElasticSearch Operations:
  search.search: avg=26.42ms, min=5.26ms, max=209.36ms (n=10)

MongoDB Operations:
  getHubs: avg=44.87ms, min=38.21ms, max=52.13ms (n=10)
  getMatchingHubsCount: avg=43.64ms, min=39.87ms, max=48.91ms (n=10)

Total Operations Analyzed: 30
Total Time Measured: 1,149.30ms
```

---

### 4. `analyze_dataloader.py`

**Purpose:** Analyzes data loader performance and Redux state preparation.

**Usage:**

```bash
python3 analyze_dataloader.py ../data/perf_logs.txt
```

**What it does:**

1. Extracts data loader timing information
2. Analyzes RequestState execution
3. Identifies parallel vs sequential operations
4. Calculates overhead and waterfall timings

**Output:**

```
Data Loader Performance Analysis
=================================

RequestState Execution:
  Total time: 205.89ms
  Parallel operations: 3
  Sequential overhead: 11.23ms

Component Breakdown:
  /api/references/search: 116.62ms (56.6%)
  /api/relationTypes/get: 38.80ms (18.8%)
  Other operations: 50.47ms (24.5%)
```

---

### 5. `analyze_load_test.py`

**Purpose:** Comprehensive analysis of load test results.

**Usage:**

```bash
python3 analyze_load_test.py ../data/perf_logs_loadtest.txt
```

**What it does:**

1. Extracts timing data from load test logs
2. Groups results by concurrency level
3. Calculates degradation percentages
4. Analyzes performance by entity characteristics
5. Identifies performance patterns and outliers

**Output:**

```
Load Test Performance Analysis
==============================

Concurrency Level Analysis:
--------------------------

Concurrency 1:
  Total requests: 30
  Avg response time: 325.20ms
  Throughput: 3.07 rps
  95th percentile: 568ms

Concurrency 5:
  Total requests: 30
  Avg response time: 713.45ms
  Throughput: 5.88 rps
  95th percentile: 1,234ms
  Degradation: +119.3%

Performance by Entity Type:
  892 relationships: 2.6x slowdown
  644 relationships: 2.4x slowdown
  469 relationships: 2.2x slowdown
```

---

### 6. `analyze_final_perf.py`

**Purpose:** Analyzes final performance benchmark data and generates summaries.

**Usage:**

```bash
python3 analyze_final_perf.py ../data/final_perf_data.txt
```

**What it does:**

1. Parses structured performance log entries
2. Generates statistical summaries
3. Identifies performance regressions or improvements
4. Compares against baseline metrics

---

### 7. `create_execution_tree.py`

**Purpose:** Creates visual execution trees from performance logs to show call hierarchies.

**Usage:**

```bash
python3 create_execution_tree.py ../data/perf_logs.txt
```

**What it does:**

1. Parses nested performance log entries
2. Builds hierarchical call trees
3. Shows timing relationships between operations
4. Identifies bottlenecks in call chains

**Output:**

```
Execution Tree:
└─ requestViewerState (605ms)
   ├─ getDocument (45ms)
   ├─ relationshipsSearch (504ms)
   │  ├─ ElasticSearch search.search (420ms) [83%]
   │  ├─ getHubs (47ms)
   │  └─ getMatchingHubsCount (44ms)
   └─ Other operations (56ms)
```

---

### 8. `extract_es_times.py`

**Purpose:** Extracts and analyzes ElasticSearch query timing data.

**Usage:**

```bash
python3 extract_es_times.py ../data/perf_logs_loadtest.txt
```

**What it does:**

1. Extracts all ElasticSearch query times from logs
2. Calculates statistics (avg, median, p95, p99)
3. Groups by query type or context
4. Identifies slow queries and outliers

**Output:**

```
ElasticSearch Query Performance
================================
Total queries: 120
Average time: 412.35ms
Median time: 405.20ms
95th percentile: 521.40ms
99th percentile: 568.90ms

Slowest queries:
  1. 568.90ms (entity: egfjcp0mp1w, 892 IDs)
  2. 542.15ms (entity: rbft3apinse, 892 IDs)
  3. 521.40ms (entity: mm95ay0ix4, 874 IDs)
```

---

## Extracting ElasticSearch Timings from Load Tests

To analyze ElasticSearch performance specifically during load tests:

```bash
# Extract all ES timings
grep "ElasticSearch search.search" ../perf_logs_loadtest.txt | \
  sed -E 's/.*: ([0-9.]+) ms.*/\1/' > /tmp/es_times.txt

# Calculate averages per concurrency level
python3 << 'EOF'
#!/usr/bin/env python3
with open('/tmp/es_times.txt') as f:
    times = [float(line.strip()) for line in f if line.strip()]

# Split into batches of 30 (10 entities × 3 requests per concurrency)
batch_size = 30
concurrency_levels = [1, 5, 10, 20]

print("ElasticSearch Timing Averages by Concurrency Level:")
print("=" * 60)

for i, conc in enumerate(concurrency_levels):
    batch = times[i*batch_size:(i+1)*batch_size]
    if batch:
        avg = sum(batch) / len(batch)
        min_time = min(batch)
        max_time = max(batch)
        print(f"Concurrency {conc:2d}: avg={avg:6.2f}ms, "
              f"min={min_time:6.2f}ms, max={max_time:6.2f}ms (n={len(batch)})")
EOF
```

---

## Typical Workflow

### 1. Initial Benchmark (Single Entity)

```bash
# Start server with logging
yarn hot > ../data/perf_logs.txt 2>&1 &
sleep 60

# Run benchmark
cd performance_analysis/scripts
./run_benchmark.sh egfjcp0mp1w 10

# Analyze backend performance
python3 analyze_backend.py ../data/perf_logs.txt
```

### 2. Load Testing

```bash
# Start fresh server instance
pkill -f "node.*hot"
yarn hot > ../data/perf_logs_loadtest.txt 2>&1 &
sleep 60

# Run load test
cd performance_analysis/scripts
node load_test.js

# Analyze load test results
python3 analyze_load_test.py ../data/perf_logs_loadtest.txt

# Extract ES-specific timings
grep "ElasticSearch search.search" ../data/perf_logs_loadtest.txt | \
  sed -E 's/.*: ([0-9.]+) ms.*/\1/' > /tmp/es_times.txt
wc -l /tmp/es_times.txt  # Should be 120
```

### 3. Compare Results

```bash
# Single request performance
echo "Single Request:"
grep "ElasticSearch search.search" ../data/perf_logs.txt | tail -10 | \
  awk -F': ' '{sum+=$2; count++} END {print "  ES avg:", sum/count, "ms"}'

# Load test performance (C=1)
echo "Load Test (C=1):"
head -30 /tmp/es_times.txt | \
  awk '{sum+=$1; count++} END {print "  ES avg:", sum/count, "ms"}'
```

---

## Configuration

### Test Entities

All scripts use these high-relationship entities by default:

| Shared ID   | Relationships | Use Case       |
| ----------- | ------------- | -------------- |
| egfjcp0mp1w | 892           | Worst case     |
| rbft3apinse | 892           | Multi-language |
| mm95ay0ix4  | 874           | Similar load   |
| rfrw6wbn6d  | 644           | Medium load    |
| 4pu4bwybbwj | 469           | Lower load     |
| 2rpox8umh35 | 468           | Similar        |
| mcbck9t3xuj | 442           | Moderate       |
| fqt8aa7zj5w | 437           | Moderate       |
| blal00ukpl  | 436           | Moderate       |
| dgkak61x7te | 434           | Moderate       |

### Server Requirements

- Node.js with performance instrumentation enabled
- ElasticSearch running on `localhost:9200`
- MongoDB accessible
- Branch: `perf/entityview-instrumentation`

---

## Troubleshooting

### "Server not responding"

```bash
# Check if server is running
curl -s 'http://localhost:3000/entity/egfjcp0mp1w' | head -1

# Restart server
pkill -f "node.*hot"
yarn hot > ../data/perf_logs.txt 2>&1 &
sleep 60
```

### "No performance logs found"

```bash
# Verify instrumentation is active
grep "\[PERF\]" ../../app/api/relationships/relationshipsSearch.js

# Check correct branch
git branch --show-current  # Should show: perf/entityview-instrumentation

# Verify logs are being written
tail -f ../data/perf_logs.txt
```

### "Entity not found"

```bash
# List available entities with high relationship counts
curl -s 'http://localhost:9200/uwazi_development/_search?pretty' \
  -H 'Content-Type: application/json' \
  -d '{"size": 10, "query": {"match_all": {}}, "_source": ["sharedId", "title"]}' | \
  grep -E "sharedId|title"
```

---

## Output Files

After running benchmarks and load tests, you'll have these files in the `../data/` directory:

- `perf_logs.txt` - Server logs from single request benchmarking
- `perf_logs_loadtest.txt` - Server logs from load testing
- `perf_logs_final.txt` - Final benchmark run logs
- `perf_logs_instrumented.txt` - Logs with full instrumentation enabled
- `final_perf_data.txt` - Structured performance data for analysis
- `/tmp/es_times.txt` - Extracted ElasticSearch timings (temporary)

---

## See Also

- `../BENCHMARK_METHODOLOGY.md` - Complete methodology documentation
- `../BOTTLENECK_INVESTIGATION.md` - Detailed investigation findings
- `../QUICKSTART.md` - Quick reference guide
- `../README.md` - Project overview
