# Search Performance Bottleneck Analysis

**Date**: February 23, 2026  
**Test Run**: Comprehensive search load test (120 requests)  
**Database**: 1,319,876 documents in ElasticSearch

---

## 🎯 Executive Summary

**Primary Finding**: Search API requests are taking **595-1234ms** on average, but the system lacks instrumentation to identify the exact bottleneck locations.

**Key Issue**: Unlike entity relationship queries (which have 96 instrumentation points), the search API (`/api/search`) has **NO performance instrumentation**, making it impossible to identify where the 500-1200ms is being spent.

---

## 📊 Test Results Overview

### Performance by Concurrency Level

| Concurrency | Avg Response Time | Throughput | Degradation from Baseline |
| ----------- | ----------------- | ---------- | ------------------------- |
| 1           | 595ms             | 1.68 rps   | Baseline                  |
| 5           | 626ms             | 6.89 rps   | +5.3%                     |
| 10          | 789ms             | 9.87 rps   | +32.7%                    |
| 20          | 1,234ms           | 11.24 rps  | +107.5%                   |

### Performance by Search Complexity

| Complexity                   | Avg Time (C=1) | Avg Time (C=20) | Range      |
| ---------------------------- | -------------- | --------------- | ---------- |
| **Low** (simple terms)       | 625ms          | 1,253ms         | 505-1550ms |
| **Medium** (boolean/phrases) | 630ms          | 1,259ms         | 543-1625ms |
| **High** (wildcards/complex) | 545ms          | 1,200ms         | 402-1664ms |

**Observation**: Search complexity has minimal impact on performance (~5% variance), suggesting the bottleneck is NOT in query parsing or ElasticSearch execution.

---

## 🔍 Bottleneck Analysis

### What We Know

#### 1. **Entity Relationship Queries (Instrumented)**

From the entity benchmark, we have detailed breakdowns:

```
Total Request: ~115ms (after ES fix)
├─ MongoDB getHubs: 45ms (39.1%)
├─ MongoDB getMatchingHubsCount: 42ms (36.5%)
├─ ElasticSearch query: 8ms (7.0%)
└─ Other operations: 20ms (17.4%)
```

**Entity queries are FAST** because the ES aggregation bug was fixed.

#### 2. **Search Queries (NOT Instrumented)**

From our load test:

- **Total request time**: 595-1234ms (measured client-side)
- **ElasticSearch query time**: **UNKNOWN** (no instrumentation)
- **Response processing time**: **UNKNOWN** (no instrumentation)
- **Query building time**: **UNKNOWN** (no instrumentation)

### What We DON'T Know

The `/api/search` endpoint lacks instrumentation for:

1. ❌ **Query building time** (`buildQuery()` function)

   - Template fetching
   - Dictionary fetching
   - Filter processing
   - Query construction

2. ❌ **ElasticSearch query time** (`elastic.search()`)

   - Actual ES query execution
   - Result parsing
   - Highlighting/snippet generation

3. ❌ **Response processing time** (`processResponse()`)

   - Template matching
   - Dictionary lookups
   - Aggregation processing
   - Permission filtering

4. ❌ **Full-text search specifics**
   - `query_string` vs `simple_query_string` selection
   - Query validation time
   - Field searching (metadata vs fullText)

---

## 🚨 Primary Bottleneck Hypotheses

### Hypothesis 1: Template/Dictionary Loading (Most Likely)

**Evidence:**

```javascript
// From search.js:798-800
const resources = await Promise.all([templatesModel.get(), dictionariesModel.get()]);
const [templates, dictionaries] = resources;
```

**Why this is likely:**

- Templates and dictionaries are fetched on EVERY search request
- No caching visible in the code
- This is a serial blocking operation before ES query even starts
- Could account for 200-400ms easily

**How to test:**

```bash
# Add instrumentation before/after this line
const startTemplates = performance.now();
const resources = await Promise.all([templatesModel.get(), dictionariesModel.get()]);
console.log('[PERF][Search] Templates/Dictionaries fetch:', performance.now() - startTemplates, 'ms');
```

### Hypothesis 2: Response Processing

**Evidence:**

```javascript
// From search.js:827-834
const processed = await processResponse(response, templates, dictionaries, language, query.filters);
```

**Why this is likely:**

- Processes ALL search results (30 results typically)
- Does dictionary lookups for each result
- Processes aggregations
- Could account for 100-300ms

**How to test:**

```bash
# Add instrumentation around processResponse
const startProcess = performance.now();
const processed = await processResponse(...);
console.log('[PERF][Search] Response processing:', performance.now() - startProcess, 'ms');
```

### Hypothesis 3: ElasticSearch Query Time

**Evidence:**

- Entity ES queries are 8-14ms (very fast after fix)
- Search ES queries **should** be similar or slightly slower

**Why this is less likely:**

- ES is proven fast for entity queries
- Search complexity doesn't correlate with performance (low/medium/high all similar)
- If ES was slow, complex queries would be slower than simple ones

**Expected time**: 20-100ms (needs measurement to confirm)

### Hypothesis 4: Query Building

**Evidence:**

```javascript
// From search.js:801-822
const queryBuilder = await buildQuery(query, language, user, resources);
// ... various aggregation builders ...
const esQuery = queryBuilder.query();
```

**Why this is possible:**

- Builds complex ES query with filters, aggregations, permissions
- Has to process user permissions
- Constructs nested boolean queries

**Expected time**: 50-150ms (needs measurement to confirm)

---

## 📈 Performance Characteristics Observed

### 1. Minimal Complexity Impact

Search complexity has very little impact on performance:

- Low complexity: 625ms avg
- Medium complexity: 630ms avg
- High complexity: 545ms avg (actually FASTER!)

**Implication**: The bottleneck is NOT in the ElasticSearch query execution itself, but in the overhead before/after the query.

### 2. Concurrency Degradation Pattern

Performance degrades moderately with concurrency:

- C=1 → C=5: +5.3% (excellent scaling)
- C=5 → C=10: +26.0% (good scaling)
- C=10 → C=20: +56.4% (moderate degradation)

**Implication**: Bottleneck is likely I/O-bound (database queries, not CPU-bound).

### 3. Full-Text Searches Are Fastest

Searches with `fullText:()` syntax returning 0 results are fastest (402-482ms).

**Implication**:

- Result processing adds 100-200ms overhead
- Fewer results = faster processing
- Supports Hypothesis 2 (response processing bottleneck)

---

## 🎯 Recommended Investigation Steps

### Step 1: Add Basic Instrumentation

Add timing to the main search function (`app/api/search/search.js:798`):

```javascript
async search(query, language, user) {
  const totalStart = performance.now();

  // 1. Template/Dictionary loading
  const resourcesStart = performance.now();
  const resources = await Promise.all([templatesModel.get(), dictionariesModel.get()]);
  console.log('[PERF][Search] Templates/Dictionaries:', (performance.now() - resourcesStart).toFixed(2), 'ms');

  const [templates, dictionaries] = resources;

  // 2. Query building
  const buildStart = performance.now();
  const queryBuilder = await buildQuery(query, language, user, resources);
  // ... aggregation builders ...
  const esQuery = queryBuilder.query();
  console.log('[PERF][Search] Query building:', (performance.now() - buildStart).toFixed(2), 'ms');

  // 3. ElasticSearch execution
  const esStart = performance.now();
  const response = await elastic.search({ body: esQuery });
  console.log('[PERF][Search] ElasticSearch query:', (performance.now() - esStart).toFixed(2), 'ms');
  console.log('[PERF][Search] ES result count:', response.body.hits.total.value || 0);

  // 4. Response processing
  const processStart = performance.now();
  const processed = await processResponse(
    response,
    templates,
    dictionaries,
    language,
    query.filters
  );
  console.log('[PERF][Search] Response processing:', (performance.now() - processStart).toFixed(2), 'ms');

  console.log('[PERF][Search] TOTAL:', (performance.now() - totalStart).toFixed(2), 'ms');

  return processed;
}
```

### Step 2: Run Targeted Benchmark

After adding instrumentation:

```bash
# Restart server
yarn hot > perf_logs_search_instrumented.txt 2>&1 &
sleep 60

# Run simple benchmark
./performance_analysis/scripts/run_search_benchmark.sh "human rights" 10

# Analyze results
grep "\[PERF\]\[Search\]" perf_logs_search_instrumented.txt
```

### Step 3: Compare Operations

Extract and average the timing:

```bash
grep "\[PERF\]\[Search\]" perf_logs_search_instrumented.txt | \
  awk '{
    if ($0 ~ /Templates/) templates+=$(NF-1);
    if ($0 ~ /Query building/) building+=$(NF-1);
    if ($0 ~ /ElasticSearch query:/) es+=$(NF-1);
    if ($0 ~ /Response processing/) processing+=$(NF-1);
    if ($0 ~ /TOTAL:/) total+=$(NF-1);
    count++
  }
  END {
    n=count/5;
    print "Average timings (n=" n "):";
    print "  Templates/Dictionaries:", templates/n, "ms";
    print "  Query building:        ", building/n, "ms";
    print "  ElasticSearch:         ", es/n, "ms";
    print "  Response processing:   ", processing/n, "ms";
    print "  TOTAL:                 ", total/n, "ms";
  }'
```

---

## 💡 Optimization Opportunities (Pending Confirmation)

### If Templates/Dictionaries is the bottleneck (>200ms):

**Solution**: Implement caching

```javascript
const templateCache = new Map();
const dictionaryCache = new Map();
const CACHE_TTL = 60000; // 1 minute

async function getCachedResources() {
  const now = Date.now();

  if (!templateCache.has('data') || templateCache.get('timestamp') < now - CACHE_TTL) {
    const templates = await templatesModel.get();
    templateCache.set('data', templates);
    templateCache.set('timestamp', now);
  }

  if (!dictionaryCache.has('data') || dictionaryCache.get('timestamp') < now - CACHE_TTL) {
    const dictionaries = await dictionariesModel.get();
    dictionaryCache.set('data', dictionaries);
    dictionaryCache.set('timestamp', now);
  }

  return [templateCache.get('data'), dictionaryCache.get('data')];
}
```

**Expected Improvement**: 200-400ms saved per request (30-60% faster)

### If Response Processing is the bottleneck (>200ms):

**Solutions**:

1. Limit result processing to only required fields
2. Lazy-load dictionary lookups
3. Parallelize aggregation processing
4. Use streaming for large result sets

**Expected Improvement**: 100-200ms saved (15-30% faster)

### If ElasticSearch is slow (>100ms):

**Solutions**:

1. Add query result caching
2. Optimize query structure (remove unnecessary clauses)
3. Tune ES index settings
4. Add query profiling

**Expected Improvement**: 50-100ms saved (10-15% faster)

---

## 📊 Comparison: Entity vs Search Performance

| Metric                 | Entity Queries  | Search Queries  | Difference  |
| ---------------------- | --------------- | --------------- | ----------- |
| **Average Time (C=1)** | 325ms           | 595ms           | +83% slower |
| **ElasticSearch Time** | 26ms (measured) | ~? ms (unknown) | Unknown     |
| **MongoDB Time**       | 87ms (measured) | N/A             | N/A         |
| **Overhead Time**      | 212ms           | ~? ms (unknown) | Unknown     |
| **Instrumentation**    | ✅ 96 points    | ❌ 0 points     | None        |

**Key Takeaway**: Search queries are **83% slower** than entity queries, but we don't know why because there's no instrumentation.

---

## ✅ Next Steps

1. **Add instrumentation** to `/api/search/search.js` (Highest Priority)
2. **Run instrumented benchmark** to identify actual bottlenecks
3. **Implement targeted optimizations** based on data
4. **Re-test** to measure improvements
5. **Add instrumentation** to other search-related files:
   - `app/api/search/buildQuery.js`
   - `app/api/search/processResponse.js`
   - `app/api/search/documentQueryBuilder.js`

---

## 📝 Files That Need Instrumentation

| File                                     | Function           | Priority | Expected Bottleneck                             |
| ---------------------------------------- | ------------------ | -------- | ----------------------------------------------- |
| `app/api/search/search.js`               | `search()`         | **HIGH** | Template loading, ES query, response processing |
| `app/api/search/routes.js`               | Route handlers     | MEDIUM   | Request parsing                                 |
| `app/api/search/buildQuery.js`           | `buildQuery()`     | MEDIUM   | Query construction                              |
| `app/api/search/processResponse.js`      | All functions      | MEDIUM   | Result processing                               |
| `app/api/search/documentQueryBuilder.js` | `fullTextSearch()` | LOW      | Query string building                           |

---

## 🔗 References

- Entity benchmark results: `performance_analysis/README.md`
- Search load test script: `performance_analysis/scripts/search_load_test.js`
- Search API code: `app/api/search/search.js:798-839`
- Entity instrumentation example: `app/api/relationships/relationshipsSearch.js`

---

**Status**: Investigation required - instrumentation must be added before bottlenecks can be identified.
