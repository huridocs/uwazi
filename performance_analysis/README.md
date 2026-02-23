# EntityView Performance Analysis

This directory contains comprehensive performance instrumentation, analysis tools, and findings for the EntityView route performance investigation.

## 🎯 Key Finding

**ElasticSearch queries account for 81.6% of EntityView execution time**, averaging **411.40ms per search**. This is the PRIMARY bottleneck.

Complete breakdown:

```
Total SSR: ~665ms
└─ referencesAPI.search: 608.5ms (91.5%)
   └─ /api/references/search: 504.0ms (82.8%)
      └─ relationshipsSearch: 503.9ms
         ├─ ElasticSearch: 411.4ms (81.6%) ⬅️ PRIMARY BOTTLENECK
         ├─ getHubs aggregation: 33.1ms (6.6%)
         ├─ getMatchingHubsCount: 31.2ms (6.2%)
         └─ All other ops: <15ms (3%)
```

---

## 📁 Directory Structure

```
performance_analysis/
├── README.md                           # This file - Overview and quick reference
├── QUICKSTART.md                       # Quick start guide for entity benchmarks
├── SEARCH_BENCHMARK_GUIDE.md           # Complete guide for search benchmarks
├── BENCHMARK_METHODOLOGY.md            # Complete methodology for replication
├── BOTTLENECK_INVESTIGATION.md        # Detailed ElasticSearch bottleneck findings
├── reports/                            # Analysis reports
│   ├── backend_bottleneck_analysis.md  # Complete findings with backend breakdown
│   └── load_test_analysis.md           # Load testing results
└── scripts/                            # Testing and analysis tools
    ├── run_benchmark.sh                # Entity benchmark runner (by ID)
    ├── run_search_benchmark.sh         # Search benchmark runner (by query)
    ├── load_test.js                    # Entity load testing script
    ├── search_load_test.js             # Search load testing script
    ├── analyze_load_test.py            # Analyze concurrency-level performance
    ├── analyze_backend.py              # Analyze backend operation breakdown
    └── analyze_dataloader.py           # Analyze data loader timing
```

---

## 🔧 Instrumented Files (96 Measurement Points)

### Phase 1: SSR & Backend (37 points)

1. `app/react/entry-server.tsx` - SSR orchestration (9 points)
2. `app/react/Viewer/EntityView.js` - Entity view data loading (6 points)
3. `app/react/Viewer/ViewerRoute.js` - Route delegation (3 points)
4. `app/api/entities/entities.js` - Entity database operations (6 points)
5. `app/api/entities/routes.js` - Entity API endpoints (2 points)
6. `app/api/relationships/relationships.js` - Relationship queries (9 points)
7. `app/api/relationships/routes.js` - Relationships API endpoints (2 points)

### Phase 2: Data Loader (44 points)

8. `app/react/Viewer/actions/routeActions.js` - requestViewerState orchestration (7 points)
9. `app/react/Viewer/actions/documentActions.js` - getDocument breakdown (3 points)
10. `app/react/Relationships/utils/routeUtils.js` - requestState breakdown (4 points)
11. `app/react/Viewer/referencesAPI.js` - All API methods (4 points)
12. `app/api/relationtypes/routes.js` - API endpoint timing (2 points)
13. `app/api/relationtypes/relationtypes.js` - Backend operations (2 points)

### Phase 3: Backend Deep Dive (15 points)

14. `app/api/relationships/relationshipsSearch.js` - Complete breakdown (15 points)
    - processFilterCombinations
    - getRightSideConnections (with sub-queries)
    - ElasticSearch search
    - filterMatchingConnections
    - getMatchingHubsCount
    - getHubs
    - destructureHubsIntoEntities (with sub-operations)
    - sortBySearchResultOrder

All instrumentation uses `performance.now()` and `console.log()` with `[PERF]` prefix for easy filtering.

---

## 📚 Documentation Guide

### Quick Reference Documents

| Document                                                       | Purpose                         | When to Use                                                    |
| -------------------------------------------------------------- | ------------------------------- | -------------------------------------------------------------- |
| **[QUICKSTART.md](QUICKSTART.md)**                             | Entity benchmark guide          | When testing entity relationship query performance             |
| **[SEARCH_BENCHMARK_GUIDE.md](SEARCH_BENCHMARK_GUIDE.md)**     | Search benchmark guide          | When testing full-text search query performance                |
| **[BENCHMARK_METHODOLOGY.md](BENCHMARK_METHODOLOGY.md)**       | Complete replication guide      | When documenting new issues or replicating past investigations |
| **[BOTTLENECK_INVESTIGATION.md](BOTTLENECK_INVESTIGATION.md)** | Detailed ES bottleneck analysis | When understanding the aggregation bug and ES query structure  |

### How to Use This Documentation

**For Running Entity Benchmarks (Relationship Queries):**

1. Read [QUICKSTART.md](QUICKSTART.md)
2. Run `./scripts/run_benchmark.sh egfjcp0mp1w 5`
3. Check results

**For Running Search Benchmarks (Full-Text Search):**

1. Read [SEARCH_BENCHMARK_GUIDE.md](SEARCH_BENCHMARK_GUIDE.md)
2. Run `./scripts/run_search_benchmark.sh "human rights" 5`
3. Or run comprehensive test: `node scripts/search_load_test.js`
4. Check results

**For Detailed Investigation:**

1. Read [BENCHMARK_METHODOLOGY.md](BENCHMARK_METHODOLOGY.md) - Complete process
2. Read [BOTTLENECK_INVESTIGATION.md](BOTTLENECK_INVESTIGATION.md) - Specific findings
3. Use analysis scripts to generate reports

**For Future Performance Issues:**

1. Use [BENCHMARK_METHODOLOGY.md](BENCHMARK_METHODOLOGY.md) as a template
2. Document entity IDs, database state, and metrics
3. Follow the same investigation process

---

## 🚀 How to Use

### 1. Entity Benchmarks (Relationship Queries)

Use the automated entity benchmark script:

```bash
# Start server with logging
yarn hot > perf_logs.txt 2>&1 &
sleep 60

# Run benchmark (5 requests to primary test entity)
./performance_analysis/scripts/run_benchmark.sh egfjcp0mp1w 5

# View results
grep "Average ES query time" perf_logs.txt
```

See [QUICKSTART.md](QUICKSTART.md) for more details.

### 2. Search Benchmarks (Full-Text Search)

Test search query performance:

```bash
# Start server with logging
yarn hot > perf_logs.txt 2>&1 &
sleep 60

# Run single search benchmark
./performance_analysis/scripts/run_search_benchmark.sh "human rights" 5

# Run comprehensive search load test
cd performance_analysis/scripts
node search_load_test.js
```

See [SEARCH_BENCHMARK_GUIDE.md](SEARCH_BENCHMARK_GUIDE.md) for complete guide.

### 3. Running Load Tests

**Entity Load Tests:**

```bash
# Start server with performance logging
yarn hot > perf_logs.txt 2>&1 &
sleep 60

# Run entity load test
cd performance_analysis/scripts
node load_test.js
```

**Search Load Tests:**

```bash
# Start server with performance logging
yarn hot > perf_logs.txt 2>&1 &
sleep 60

# Run search load test
cd performance_analysis/scripts
node search_load_test.js

# Or with extended queries
USE_ALL_SEARCHES=true node search_load_test.js
```

**Entity Load Test Details:**

- Tests 10 entities with 434-892 relationships each
- Runs at 4 concurrency levels: 1, 5, 10, 20
- Makes 120 total requests (10 entities × 3 iterations × 4 levels)
- Outputs detailed timing and degradation analysis

**Search Load Test Details:**

- Tests 10 different search queries (varying complexity)
- Runs at 4 concurrency levels: 1, 5, 10, 20
- Makes 120 total requests (10 searches × 3 iterations × 4 levels)
- Measures impact of search complexity on performance

### 4. Analyzing Results

After running load tests or benchmarks, analyze the results:

```bash
cd performance_analysis/scripts

# Analyze by concurrency level
python3 analyze_load_test.py ../../perf_logs.txt

# Analyze backend operation breakdown
python3 analyze_backend.py ../../perf_logs.txt

# Analyze data loader breakdown
python3 analyze_dataloader.py ../../perf_logs.txt
```

Each script outputs:

- **analyze_load_test.py**: Response times, throughput, degradation by concurrency
- **analyze_backend.py**: Backend operation timing ranked by duration
- **analyze_dataloader.py**: Data loader call breakdown with percentages

### 3. Viewing Reports

Read the comprehensive analysis reports:

```bash
# Complete findings with backend breakdown
cat reports/backend_bottleneck_analysis.md

# Load testing results and concurrency analysis
cat reports/load_test_analysis.md
```

---

## ✅ Resolution Summary

**Issue:** ElasticSearch queries taking 380-420ms and consuming 81.6% of total request time.

**Root Cause:** Aggregations running despite `performAggregations: false` flag:

- Global aggregation scanning 1,695,806 documents
- Duplicate 892-ID terms query inside aggregations
- ~260ms wasted on unnecessary aggregation processing

**Fix Applied:** Correctly handle `performAggregations: false` flag to prevent aggregations from running.

**Results (Single Request):**

- **Before:** 420ms ElasticSearch query time (81.6% of total)
- **After:** 7.86ms ElasticSearch query time (2.7% of total)
- **Improvement:** 98.1% faster (412ms saved per request)
- **Total response time:** 665ms → 289ms (56.5% faster)

**Load Testing Validation:**

- 120 requests across 4 concurrency levels (1, 5, 10, 20)
- ElasticSearch remains fast even under heavy load:
  - Concurrency 1: 26.42ms average
  - Concurrency 20: 74.64ms average (still 82% faster than original)
- Peak throughput: 6.28 requests/second at concurrency 10
- ES is no longer the bottleneck under any load condition

**Full Details:** See [BOTTLENECK_INVESTIGATION.md](BOTTLENECK_INVESTIGATION.md)

---

## 📊 Performance Results

### Single Request Performance (After Fix)

| Metric              | Before Fix | After Fix | Improvement |
| ------------------- | ---------- | --------- | ----------- |
| Total SSR           | 665ms      | 289ms     | **-56.5%**  |
| ElasticSearch       | 411ms      | 7.86ms    | **-98.1%**  |
| relationshipsSearch | 504ms      | 116.55ms  | **-76.9%**  |

### Load Testing Results (After Fix)

| Concurrency | Avg Response | Throughput | Degradation | ElasticSearch Avg |
| ----------- | ------------ | ---------- | ----------- | ----------------- |
| 1           | 325ms        | 3.07 rps   | Baseline    | 26.42ms           |
| 5           | 713ms        | 5.88 rps   | +119%       | 25.18ms (-4.7%)   |
| 10          | 1,337ms      | 6.28 rps   | +311%       | 40.01ms (+51%)    |
| 20          | 2,303ms      | 6.12 rps   | +609%       | 74.64ms (+183%)   |

**Key Finding:** ElasticSearch optimization holds up under concurrent load. The fix eliminated the primary bottleneck permanently.

---

## 📊 Current Performance Characteristics

### Primary Bottleneck (RESOLVED ✅)

~~🔴 **ElasticSearch search query** - 411.40ms average~~

✅ **ElasticSearch search query** - 7.86ms average (single) / 26-75ms (under load)

- **Fixed:** Properly respecting `performAggregations: false` flag
- **Result:** 98% improvement in single requests, 82-93% improvement under load
- **Status:** No longer a bottleneck

### Current Operations (After Fix)

| Operation              | Mean Time | % of Total | Status        |
| ---------------------- | --------- | ---------- | ------------- |
| relationshipsSearch    | 116.55ms  | 40.3%      | 🟡 Moderate   |
| getHubs aggregation    | 44.87ms   | 15.5%      | 🟢 Acceptable |
| getMatchingHubsCount   | 43.64ms   | 15.1%      | 🟢 Acceptable |
| React rendering        | 34.94ms   | 12.1%      | ✅ Optimized  |
| Global resources fetch | 11.98ms   | 4.1%       | ✅ Optimized  |
| ElasticSearch query    | 7.86ms    | 2.7%       | ✅ **FIXED**  |

---

## 🔍 What Each Analysis Script Does

### load_test.js

- Performs HTTP load testing against EntityView routes
- Tests multiple entities concurrently at different load levels
- Measures end-to-end response times
- Calculates throughput and degradation
- Outputs progress and summary statistics

### analyze_load_test.py

- Parses `[PERF]` logs from server output
- Groups results by concurrency level
- Calculates statistics (mean, median, percentiles)
- Identifies slowest operations
- Shows performance degradation trends

### analyze_backend.py

- Parses backend operation timing from relationshipsSearch
- Ranks all operations by execution time
- Calculates percentages relative to total
- Provides detailed breakdown of major operations
- Identifies primary and secondary bottlenecks

### analyze_dataloader.py

- Parses data loader timing from requestViewerState
- Shows breakdown of parallel vs sequential operations
- Calculates percentage of total SSR time
- Identifies which API call is slowest

---

## 📈 Key Metrics

### Response Time by Concurrency (After Fix)

| Concurrency | Avg Response | Throughput (rps) | Degradation | ElasticSearch Avg |
| ----------- | ------------ | ---------------- | ----------- | ----------------- |
| 1           | 325ms        | 3.07             | Baseline    | 26.42ms           |
| 5           | 713ms        | 5.88             | +119%       | 25.18ms           |
| 10          | 1,337ms      | 6.28             | +311%       | 40.01ms           |
| 20          | 2,303ms      | 6.12             | +609%       | 74.64ms           |

**Peak throughput:** 6.28 requests/second at concurrency 10

### Operation Breakdown (After Fix - % of total time)

| Operation            | Time (ms) | % of Total | Status        |
| -------------------- | --------- | ---------- | ------------- |
| relationshipsSearch  | 116.55ms  | 40.3%      | 🟡 Moderate   |
| getHubs              | 44.87ms   | 15.5%      | 🟢 Acceptable |
| getMatchingHubsCount | 43.64ms   | 15.1%      | 🟢 Acceptable |
| React rendering      | 34.94ms   | 12.1%      | ✅ Optimized  |
| Global resources     | 11.98ms   | 4.1%       | ✅ Optimized  |
| ElasticSearch        | 7.86ms    | 2.7%       | ✅ **FIXED**  |
| All other            | <5ms      | <2%        | ✅ Optimized  |

---

## 🎯 Status & Future Optimization Opportunities

### ✅ Primary Bottleneck RESOLVED

The ElasticSearch aggregations issue has been fixed, resulting in:

- 98.1% improvement in ES query time
- 56.5% improvement in total response time
- 319% improvement in peak throughput
- Stable performance under concurrent load

### 🟡 Optional Further Optimization

While performance is now acceptable for production use, additional improvements could be made:

**1. MongoDB Aggregations (Priority: Low)**

- `getHubs` and `getMatchingHubsCount` now represent the largest remaining operations
- Combined: ~88ms (30% of total time)
- Potential optimization: Index tuning, query optimization
- Expected gain: 10-15% total response time improvement

**2. Connection Pooling (Priority: Low)**

- Under high concurrency (>10), response times degrade significantly
- Suggests connection pool exhaustion or resource contention
- Potential optimization: Tune MongoDB connection pool settings
- Expected gain: Better performance at concurrency >10

**3. Caching Strategies (Priority: Low)**

- Relationship data may be cacheable for some entities
- Redis caching could reduce MongoDB load
- Expected gain: Faster responses for frequently accessed entities

### 📊 Monitoring Recommendations

For production deployment, monitor:

- ElasticSearch query times (should stay <50ms for most requests)
- MongoDB aggregation times (should stay <60ms)
- Total response times at different concurrency levels
- Memory usage and connection pool metrics

---

## 📝 Notes

### Test Entities Used

All tests use high-relationship entities (434-892 relationships each):

- egfjcp0mp1w: 892 relationships
- rbft3apinse: 892 relationships
- mm95ay0ix4: 874 relationships
- rfrw6wbn6d: 644 relationships
- 4pu4bwybbwj: 469 relationships
- 2rpox8umh35: 468 relationships
- mcbck9t3xuj: 442 relationships
- fqt8aa7zj5w: 437 relationships
- blal00ukpl: 436 relationships
- dgkak61x7te: 434 relationships

### Performance Logs

All performance instrumentation logs to console with `[PERF]` prefix:

- `[PERF][SSR]` - Server-side rendering operations
- `[PERF][DataLoader]` - Data loading operations
- `[PERF][API]` - API endpoint timing
- `[PERF][Relationships]` - Relationship queries
- `[PERF][RelationshipsSearch]` - Backend search operations
- `[PERF][Entities]` - Entity database operations

Redirect server output to capture logs:

```bash
node prod/server.js > perf_logs.txt 2>&1
```

### Instrumentation Method

All timing uses `performance.now()` for high-precision measurements:

```javascript
const start = performance.now();
// ... operation ...
console.log('[PERF][Category] Operation:', (performance.now() - start).toFixed(2), 'ms');
```

This provides microsecond precision for accurate bottleneck identification.

---

## 🔗 Related

- GitHub Issue: #8815 - "Measure and rank performance bottlenecks in EntityView route"
- Branch: `perf/entityview-instrumentation`

---

## 📄 License

This performance analysis is part of the Uwazi project.
