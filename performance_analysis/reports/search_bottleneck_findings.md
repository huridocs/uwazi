# Search Performance Bottleneck - FINDINGS

**Date**: February 23, 2026  
**Investigation**: Search API performance with full instrumentation  
**Database**: 1,319,876 documents in ElasticSearch  
**Status**: ✅ **BOTTLENECK IDENTIFIED**

---

## 🎯 Executive Summary

**PRIMARY BOTTLENECK IDENTIFIED**: **ElasticSearch query execution accounts for 97-98% of total search time**, averaging **687ms per search**.

This is in stark contrast to entity relationship queries where ElasticSearch was previously the bottleneck (411ms before fix, now 8-26ms after fix).

---

## 📊 Performance Breakdown with Instrumentation

### Test Results (5 searches for "human rights")

| Request | Total Time | ES Time  | ES %  | Resources | Build  | Process |
| ------- | ---------- | -------- | ----- | --------- | ------ | ------- |
| 1       | 728.80ms   | 712.56ms | 97.8% | 1.43ms    | 4.66ms | 10.15ms |
| 2       | 712.70ms   | 698.62ms | 98.0% | 1.29ms    | 3.43ms | 9.14ms  |
| 3       | 708.00ms   | 693.94ms | 98.0% | 1.01ms    | 3.00ms | 9.82ms  |
| 4       | 701.33ms   | 687.89ms | 98.1% | 0.92ms    | 3.00ms | 9.29ms  |
| 5       | 695.42ms   | 681.05ms | 97.9% | 0.87ms    | 2.89ms | 10.61ms |

**Average:**

- **Total**: 709.25ms
- **ElasticSearch**: 694.81ms (98.0%)
- **Response Processing**: 9.80ms (1.4%)
- **Query Building**: 3.40ms (0.5%)
- **Resources Loading**: 1.10ms (0.2%)

### Additional Test Queries

| Search Term          | Total    | ES Time  | ES %  | Result Count |
| -------------------- | -------- | -------- | ----- | ------------ |
| "treaty"             | 502.57ms | 490ms    | 97.6% | Unknown      |
| "climate AND change" | 555.83ms | 543.88ms | 97.9% | 4,167        |
| "fullText:(peace)"   | 401.65ms | 391.21ms | 97.4% | 0            |

---

## 🔍 Detailed Component Analysis

### 1. ElasticSearch Query Execution ⚠️ **PRIMARY BOTTLENECK**

**Time**: 391-713ms (average: **694ms**)  
**Percentage**: 97-98% of total time  
**Status**: 🚨 **CRITICAL - MAJOR BOTTLENECK**

**Observations:**

- Search for "human rights" (10,000 results): **~700ms**
- Search for "treaty" (unknown results): **~490ms**
- Search for "climate AND change" (4,167 results): **~544ms**
- Search for "fullText:(peace)" (0 results): **~391ms**

**Pattern**: ES query time correlates with result count:

- 10,000 results → 700ms
- 4,167 results → 544ms
- 0 results → 391ms

**Issue**: ElasticSearch is taking 50-100x longer for search queries compared to entity relationship queries:

- Entity ES queries: 8-26ms (after aggregation fix)
- Search ES queries: 391-713ms

### 2. Response Processing ✅ **NOT A BOTTLENECK**

**Time**: 7-10ms (average: **9.8ms**)  
**Percentage**: 1.3-1.7% of total time  
**Status**: ✅ **OPTIMIZED**

**Breakdown:**

- Processing 30 results: ~10ms
- Dictionary lookups: Included
- Aggregation processing: Included

**Conclusion**: Response processing is very efficient and not a concern.

### 3. Query Building ✅ **NOT A BOTTLENECK**

**Time**: 2.8-4.7ms (average: **3.4ms**)  
**Percentage**: 0.4-0.6% of total time  
**Status**: ✅ **OPTIMIZED**

**Components:**

- Query validation: ~2ms
- Filter processing: Included
- Boolean query construction: Included
- Aggregation setup: Included

**Conclusion**: Query building is very fast and efficient.

### 4. Templates/Dictionaries Loading ✅ **NOT A BOTTLENECK**

**Time**: 0.9-1.4ms (average: **1.1ms**)  
**Percentage**: 0.1-0.2% of total time  
**Status**: ✅ **ALREADY CACHED**

**Conclusion**: Despite initial hypothesis, template/dictionary loading is NOT a bottleneck. There appears to be effective caching in place.

---

## 📈 Comparison: Search vs Entity Queries

| Metric            | Entity Queries | Search Queries | Difference         |
| ----------------- | -------------- | -------------- | ------------------ |
| **Total Time**    | 325ms          | 709ms          | **+118% slower**   |
| **ElasticSearch** | 26ms (7%)      | 695ms (98%)    | **+2,573% slower** |
| **Processing**    | 87ms (MongoDB) | 10ms           | -89%               |
| **Overhead**      | 212ms          | 4ms            | -98%               |

**Key Insight**: Search queries are spending almost ALL their time in ElasticSearch, whereas entity queries have optimized ES and spend most time in MongoDB.

---

## 🔍 ElasticSearch Bottleneck Investigation

### Why is Search ES So Slow?

#### Hypothesis 1: Full-Text Search vs Terms Query

**Entity queries** use **terms query** (exact ID matching):

```json
{
  "query": {
    "terms": {
      "_id": ["id1", "id2", "id3", ...]
    }
  }
}
```

- Very fast: O(log n) lookup
- Time: 8-26ms

**Search queries** use **query_string** (full-text search):

```json
{
  "query": {
    "query_string": {
      "query": "human rights",
      "fields": ["title", "metadata.*", "fullText.*"]
    }
  }
}
```

- Much slower: O(n) text matching across multiple fields
- Time: 391-713ms

#### Hypothesis 2: Result Count Impact

Evidence shows correlation between result count and query time:

- 0 results: 391ms
- 4,167 results: 544ms
- 10,000 results: 700ms

**Scoring and ranking**: ElasticSearch needs to:

1. Find all matching documents
2. Calculate relevance scores
3. Sort by score
4. Return top results

More results = more scoring/sorting work.

#### Hypothesis 3: Field Count

Search queries scan many fields:

- Title
- All metadata fields (varies by template)
- Full-text content (PDF text)

Entity queries scan only 1 field: `_id`

#### Hypothesis 4: Index Size

With 1.3M documents, full-text search must:

- Scan inverted index for each term
- Match across multiple fields
- Calculate TF-IDF scores
- Aggregate results

---

## 🎯 Root Cause Analysis

### Primary Cause: **Full-Text Search Complexity**

ElasticSearch full-text search queries are inherently slower than exact ID matching:

1. **Text Analysis**: Tokenization, stemming, normalization
2. **Field Scanning**: Multiple fields per document
3. **Relevance Scoring**: TF-IDF calculation for each match
4. **Result Ranking**: Sorting by relevance score
5. **Highlighting**: Generating snippets (if enabled)

**Expected behavior**: Full-text search IS supposed to be slower than ID lookup.

### Secondary Factor: **Result Set Size**

Queries returning 10,000 results take ~2x longer than queries with 0 results:

- 0 results: 391ms (100% search time)
- 10,000 results: 700ms (79% slower)

---

## 💡 Optimization Opportunities

### 1. Reduce Result Set Size ⭐ **HIGH IMPACT**

**Current**: Queries return up to 10,000 results  
**Issue**: Scoring and sorting 10,000 documents is expensive

**Solution 1: Limit default size**

```javascript
// In buildQuery, reduce default size
.limit(100)  // Instead of 9999 or 10000
```

**Expected Improvement**: 20-30% faster (700ms → 500-550ms)

**Solution 2: Use search_after for pagination**

```javascript
// For pagination beyond first page
{
  "search_after": [last_score, last_id],
  "size": 30
}
```

**Expected Improvement**: 40-50% faster for paginated results

### 2. Optimize Query Fields ⭐ **MEDIUM IMPACT**

**Current**: Searches all metadata fields + title + fullText  
**Issue**: More fields = more work

**Solution 1: Targeted field search**

```javascript
// Let users select which fields to search
if (query.searchFields) {
  fields = query.searchFields;
} else {
  fields = ['title', 'metadata.description.value']; // Common fields only
}
```

**Expected Improvement**: 10-20% faster (700ms → 560-630ms)

**Solution 2: Boosting instead of scanning all**

```javascript
// Boost important fields, skip less important
{
  "query_string": {
    "query": term,
    "fields": [
      "title^3",              // 3x weight
      "metadata.description.value^2",  // 2x weight
      "fullText.*"            // 1x weight
    ]
  }
}
```

**Expected Improvement**: 5-15% faster

### 3. Add Query Result Caching ⭐⭐ **VERY HIGH IMPACT**

**Current**: Every search re-executes the ES query  
**Issue**: Common searches (e.g., "human rights") repeat frequently

**Solution: Redis caching**

```javascript
const cacheKey = `search:${JSON.stringify(query)}:${language}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const results = await elastic.search(...);
await redis.setex(cacheKey, 300, JSON.stringify(results)); // 5 min TTL
return results;
```

**Expected Improvement**: 99% faster for cached queries (700ms → <10ms)  
**Cache hit rate**: Estimated 30-50% for typical usage

### 4. Use Query Profile API 🔍 **DIAGNOSTIC**

**Purpose**: Identify exactly which part of ES query is slow

**Solution:**

```javascript
const esQuery = queryBuilder.query();
esQuery.profile = true; // Enable profiling

const response = await elastic.search({ body: esQuery });

// Log profile data
if (response.body.profile) {
  console.log(
    '[PERF][ES-PROFILE] Query breakdown:',
    JSON.stringify(response.body.profile.shards[0], null, 2)
  );
}
```

**Benefit**: Pinpoint exact slow operations within ES

### 5. Index Optimization ⭐ **MEDIUM IMPACT**

**Current**: Unknown index settings  
**Possible issues**: Too many shards, not optimized

**Solution 1: Force merge**

```bash
curl -XPOST 'http://localhost:9200/uwazi_development/_forcemerge?max_num_segments=1'
```

**Expected Improvement**: 10-20% faster after merge

**Solution 2: Adjust refresh interval**

```javascript
// In index settings
{
  "refresh_interval": "30s"  // Default is 1s
}
```

**Expected Improvement**: 5-10% faster queries

### 6. Separate Full-Text from Metadata Search ⭐ **HIGH IMPACT**

**Current**: All searches scan fullText fields (PDF content)  
**Issue**: Scanning PDF content is expensive

**Solution:**

```javascript
// Only search full text if explicitly requested
if (query.searchFullText || query.searchTerm.includes('fullText:')) {
  fields = [...fields, 'fullText.*'];
} else {
  fields = ['title', 'metadata.*']; // Skip fullText
}
```

**Expected Improvement**: 30-40% faster (700ms → 420-490ms) when fullText not needed

---

## 📊 Projected Performance with Optimizations

### Conservative Estimate (Easy Wins)

| Optimization               | Current | After     | Improvement |
| -------------------------- | ------- | --------- | ----------- |
| **Baseline**               | 709ms   | -         | -           |
| + Limit results to 100     | 709ms   | 550ms     | -22%        |
| + Skip fullText by default | 550ms   | 385ms     | -30%        |
| + Force merge index        | 385ms   | 325ms     | -16%        |
| **Total Improvement**      | 709ms   | **325ms** | **-54%**    |

### Aggressive Estimate (With Caching)

| Optimization           | Hit Rate | Avg Time  |
| ---------------------- | -------- | --------- |
| Cache hit              | 40%      | 10ms      |
| Cache miss (optimized) | 60%      | 325ms     |
| **Weighted Average**   | -        | **199ms** |

**Overall improvement**: 709ms → 199ms (**-72% faster**)

---

## ✅ Recommended Action Plan

### Phase 1: Quick Wins (1-2 hours)

1. ✅ **Add instrumentation** (DONE)
2. **Limit default result size** to 100
   - File: `app/api/search/documentQueryBuilder.js`
   - Change: Default `.limit(9999)` → `.limit(100)`
3. **Skip fullText by default**
   - File: `app/api/search/search.js`
   - Change: Only include fullText fields when explicitly requested
4. **Force merge ES index**
   - Command: `curl -XPOST 'http://localhost:9200/uwazi_development/_forcemerge?max_num_segments=1'`

**Expected Result**: 709ms → 350-400ms (-50%)

### Phase 2: Medium-term (2-4 hours)

1. **Add Redis caching** for common searches
   - Cache key: `search:{query}:{language}`
   - TTL: 5 minutes
2. **Add ES query profiling** to identify slow operations
3. **Optimize field selection** based on usage patterns

**Expected Result**: 709ms → 200-250ms (-65% average with cache)

### Phase 3: Long-term (1-2 days)

1. **Implement search_after pagination**
2. **Add query result streaming** for large result sets
3. **Tune ES index settings** (shards, replicas, refresh interval)
4. **Add query complexity analysis** to warn on expensive queries

**Expected Result**: 709ms → 150-200ms (-72% average)

---

## 🔗 Related Files

### Files with Performance Instrumentation

- ✅ `app/api/search/search.js` - Main search function (INSTRUMENTED)
- ✅ `app/api/search/search.js:searchSnippets` - Snippet search (INSTRUMENTED)
- ✅ `app/api/search/search.js:searchTypeFromSearchTermValidity` - Query validation (INSTRUMENTED)

### Files Needing Optimization

- 🔧 `app/api/search/documentQueryBuilder.js` - Query construction (needs limit adjustment)
- 🔧 `app/api/search/search.js:buildQuery` - Query building (needs field optimization)
- 🔧 ElasticSearch index settings - Index configuration (needs tuning)

---

## 📝 Performance Log Samples

### Typical Search (Good)

```
[PERF][Search] Templates/Dictionaries load: 1.01 ms
[PERF][Search] Query validation: 1.95 ms - Type: query_string, Valid: true
[PERF][Search] Query building: 3.00 ms
[PERF][Search] Search term: "human rights"
[PERF][Search] ElasticSearch query: 693.94 ms - Results: 10000
[PERF][Search] Response processing: 9.82 ms - Rows: 30
[PERF][Search] TOTAL: 708.00 ms
[PERF][Search] Breakdown: Resources=1ms (0.1%), Build=3ms (0.4%), ES=694ms (98.0%), Process=10ms (1.4%)
```

### Full-Text Search (Faster due to fewer results)

```
[PERF][Search] Templates/Dictionaries load: 0.98 ms
[PERF][Search] Query validation: 1.50 ms - Type: query_string, Valid: true
[PERF][Search] Query building: 2.46 ms
[PERF][Search] Search term: "fullText:(peace)"
[PERF][Search] ElasticSearch query: 391.21 ms - Results: 0
[PERF][Search] Response processing: 6.75 ms - Rows: 0
[PERF][Search] TOTAL: 401.65 ms
[PERF][Search] Breakdown: Resources=1ms (0.2%), Build=2ms (0.6%), ES=391ms (97.4%), Process=7ms (1.7%)
```

---

## 📊 Comparison Chart

```
Entity Queries (Optimized):
■■ 26ms ES (7%)
████████████ 87ms MongoDB (27%)
████████████████████ 212ms Other (65%)
Total: 325ms

Search Queries (Current):
████████████████████████████████████████████████████ 695ms ES (98%)
■ 4ms Other (2%)
Total: 709ms

Search Queries (After Quick Wins - Projected):
█████████████████████ 325ms ES (93%)
■ 25ms Other (7%)
Total: 350ms
```

---

**Status**: Investigation complete, bottleneck identified, optimizations proposed.  
**Next Step**: Implement Phase 1 optimizations and re-test.
