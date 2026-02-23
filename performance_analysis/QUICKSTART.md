# Quick Start: Reproducing the Performance Benchmark

## TL;DR

Test entity `egfjcp0mp1w` with 892 relationships takes **380-420ms** to query ElasticSearch and returns **0 results**.

Root cause: **Aggregations run despite `performAggregations: false`** (60-70% of query time).

---

## Quick Reproduction Steps

### 1. Start the server

```bash
yarn hot > perf_logs.txt 2>&1 &
sleep 60  # Wait for startup
```

### 2. Run the benchmark

```bash
./performance_analysis/scripts/run_benchmark.sh egfjcp0mp1w 5
```

### 3. Check results

```bash
grep "ElasticSearch search.search" perf_logs.txt | tail -5
```

Expected output:

```
[PERF][RelationshipsSearch] ElasticSearch search.search: 420.47 ms - Results: 0
```

---

## Test Entities

| Shared ID     | Relationships | Use Case                         |
| ------------- | ------------- | -------------------------------- |
| `egfjcp0mp1w` | 892           | Primary test entity (worst case) |
| `rbft3apinse` | 892           | Same entity, French version      |
| `rfrw6wbn6d`  | 644           | Medium complexity                |
| `4pu4bwybbwj` | 469           | Lower complexity                 |

---

## What to Look For

**Key metrics in logs:**

- ES query time: Should be ~380-420ms
- Results returned: Should be 0
- Aggregations enabled: Should say `true` (this is the bug!)
- Entity IDs queried: Should be ~892

**Performance breakdown:**

- ElasticSearch: ~420ms (81% of total)
  - Aggregations: ~260ms (60%)
  - Terms query: ~100ms (24%)
  - Other: ~60ms (14%)
- MongoDB aggregations: ~90ms (sequential)
- Total: ~500ms

---

## Index Information

**Database:** `uwazi_development`

- Documents: 1,695,806
- Size: 7.8GB
- Shards: 1 primary
- Segments: 11

---

## Full Investigation

See `performance_analysis/BOTTLENECK_INVESTIGATION.md` for:

- Detailed setup instructions
- Full query structure analysis
- ES profiling results
- Troubleshooting guide
- Raw query examples

---

## Quick Checks

**Is server running?**

```bash
curl -s 'http://localhost:3000/entity/egfjcp0mp1w' | grep -q "<!DOCTYPE html" && echo "✅ Server OK" || echo "❌ Server not responding"
```

**Is ES healthy?**

```bash
curl -s 'http://localhost:9200/_cluster/health' | grep -q '"status":"yellow"' && echo "✅ ES OK" || echo "❌ ES problem"
```

**Get latest ES time:**

```bash
grep "ElasticSearch search.search" perf_logs.txt | tail -1 | awk '{print "Time:", $6, $7, "Results:", $10}'
```

---

## Next Investigation Steps

1. **Why do aggregations run?**

   - File: `app/api/search/search.js` line ~815-820
   - File: `app/api/relationships/relationshipsSearch.js` line ~263 (performAggregations: false)

2. **Test without aggregations**

   - Manually comment out aggregation code
   - Expected savings: 250-300ms

3. **Profile different ID counts**
   - Set `TEST_ID_COUNT=50` environment variable
   - See if time scales with ID count

---

## Load Testing

### Quick Load Test

```bash
# Start server with logging
yarn hot > perf_logs_loadtest.txt 2>&1 &
sleep 60

# Run load test (120 requests, 4 concurrency levels)
cd performance_analysis/scripts
node load_test.js
```

### Analyze Load Test Results

```bash
# Extract ElasticSearch timings per concurrency level
grep "ElasticSearch search.search" ../../perf_logs_loadtest.txt | \
  sed -E 's/.*: ([0-9.]+) ms.*/\1/' > /tmp/es_times.txt

# Calculate averages (30 requests per concurrency level)
python3 << 'EOF'
with open('/tmp/es_times.txt') as f:
    times = [float(line.strip()) for line in f if line.strip()]

batch_size = 30
concurrency_levels = [1, 5, 10, 20]

for i, conc in enumerate(concurrency_levels):
    batch = times[i*batch_size:(i+1)*batch_size]
    if batch:
        avg = sum(batch) / len(batch)
        print(f"Concurrency {conc:2d}: {avg:6.2f}ms avg")
EOF
```

### Expected Load Test Results

**After Fix:**

```
Concurrency  1: avg= 26.42ms (baseline)
Concurrency  5: avg= 25.18ms (-4.7%)
Concurrency 10: avg= 40.01ms (+51%)
Concurrency 20: avg= 74.64ms (+183%)
```

**Key Takeaway:** ElasticSearch remains fast (<75ms) even at concurrency 20, validating the fix.

---

## Benchmark Script Usage

```bash
# Basic usage (5 requests to egfjcp0mp1w)
./performance_analysis/scripts/run_benchmark.sh

# Custom entity (3 requests)
./performance_analysis/scripts/run_benchmark.sh rbft3apinse 3

# Many requests for averaging
./performance_analysis/scripts/run_benchmark.sh egfjcp0mp1w 20
```

**Output includes:**

- Per-request timing
- Average ES query time
- Aggregation status
- Full timing breakdown
- Entity ID count

---

## Contact

- Branch: `perf/entityview-instrumentation`
- Investigation date: 2026-02-23
- Issue: GitHub #8815
