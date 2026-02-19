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
├── README.md                           # This file
├── reports/                            # Analysis reports
│   ├── backend_bottleneck_analysis.md  # Complete findings with backend breakdown
│   └── load_test_analysis.md           # Load testing results
└── scripts/                            # Testing and analysis tools
    ├── load_test.js                    # Node.js load testing script
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

## 🚀 How to Use

### 1. Running Load Tests

Start the server and run load tests:

```bash
# Start server with performance logging
node prod/server.js > perf_logs.txt 2>&1

# In another terminal, run load test
cd performance_analysis/scripts
node load_test.js

# Results will be written to ../../perf_logs.txt
```

The load test:

- Tests 10 entities with 434-892 relationships each
- Runs at 4 concurrency levels: 1, 5, 10, 20
- Makes 120 total requests (10 entities × 3 iterations × 4 levels)
- Outputs detailed timing and degradation analysis

### 2. Analyzing Results

After running load tests, analyze the results:

```bash
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

## 📊 Performance Bottleneck Rankings

### Primary Bottleneck (81.6% of time)

🔴 **ElasticSearch search query** - 411.40ms average

- Location: `app/api/search/search.js` (called from relationshipsSearch)
- Called with `limit: 9999` (massive result sets)
- Range: 361-723ms
- Degrades significantly under load (+357% at 20x concurrency)

### Secondary Bottlenecks (12.8% combined)

🟡 **MongoDB aggregations** - 64.30ms combined

- getHubs aggregation: 33.08ms (6.6%)
- getMatchingHubsCount: 31.22ms (6.2%)

### Well-Optimized Operations

✅ MongoDB simple queries: <15ms
✅ Data processing: <10ms
✅ All other operations: <1ms

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

### Response Time by Concurrency

| Concurrency | Avg Response | Throughput | Degradation |
| ----------- | ------------ | ---------- | ----------- |
| 1           | 665ms        | 1.53 rps   | Baseline    |
| 5           | 1,088ms      | 4.02 rps   | +66.4%      |
| 10          | 1,795ms      | 4.74 rps   | +174.7%     |
| 20          | 3,036ms      | 4.70 rps   | +364.5%     |

### Operation Breakdown (% of total search time)

| Operation            | %     | Status       |
| -------------------- | ----- | ------------ |
| ElasticSearch        | 81.6% | 🔴 Critical  |
| getHubs              | 6.6%  | 🟡 Secondary |
| getMatchingHubsCount | 6.2%  | 🟡 Secondary |
| Other MongoDB        | 2.7%  | ✅ OK        |
| Data processing      | 1.4%  | ✅ OK        |
| All other            | <1%   | ✅ Optimized |

---

## 🎯 Next Steps for Optimization

### 1. Investigate ElasticSearch Query (Priority: Critical)

- Instrument `app/api/search/search.js` to see query details
- Profile the actual ElasticSearch query structure
- Check query explain/plan output
- Identify missing indexes
- Review the `limit: 9999` behavior

### 2. Optimize Query Structure

- Consider pagination instead of fetching 9999 results
- Optimize ID list query if the list is very large
- Review `includeUnpublished` necessity
- Check if query hits optimal indexes

### 3. MongoDB Aggregations (Priority: Low)

- Profile getHubs and getMatchingHubsCount aggregations
- Check for missing indexes
- Consider caching if data is relatively static

### 4. Load Testing & Monitoring

- Profile ElasticSearch cluster under load
- Check for resource bottlenecks (CPU, disk I/O, network)
- Monitor query queue depth
- Test with different entity sizes

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
