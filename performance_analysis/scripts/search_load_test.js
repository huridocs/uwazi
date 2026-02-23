#!/usr/bin/env node

/**
 * Search Performance Load Testing Script
 * Tests search performance with various search strings under concurrent load
 *
 * This script measures the impact of search queries on ElasticSearch performance
 * by running multiple search terms at different concurrency levels.
 */

const http = require('http');

// Test search queries with different complexities
const TEST_SEARCHES = [
  { term: 'human rights', description: 'Simple two-word search', complexity: 'low' },
  { term: 'security council resolution', description: 'Three-word phrase', complexity: 'low' },
  { term: '"general assembly"', description: 'Exact phrase match', complexity: 'medium' },
  { term: 'climate AND change', description: 'Boolean AND operator', complexity: 'medium' },
  {
    term: 'war OR conflict OR violence',
    description: 'Multiple OR operators',
    complexity: 'medium',
  },
  {
    term: 'United Nations AND (peacekeeping OR humanitarian)',
    description: 'Complex boolean query',
    complexity: 'high',
  },
  { term: 'disarmament AND NOT nuclear', description: 'Boolean with NOT', complexity: 'high' },
  {
    term: 'fullText:(international humanitarian law)',
    description: 'Full-text only search',
    complexity: 'high',
  },
  { term: 'women* AND children', description: 'Wildcard search', complexity: 'high' },
  { term: 'treaty', description: 'Single common term', complexity: 'low' },
];

// Additional test queries with varying result counts
const ADDITIONAL_SEARCHES = [
  { term: 'resolution', description: 'Very common term (high result count)', complexity: 'low' },
  { term: 'committee', description: 'Common term', complexity: 'low' },
  {
    term: 'sustainable development goals',
    description: 'Specific multi-word phrase',
    complexity: 'medium',
  },
  { term: 'cybersecurity', description: 'Less common single term', complexity: 'low' },
  { term: 'artificial intelligence', description: 'Modern topic', complexity: 'low' },
];

// Configuration
const HOST = 'localhost';
const PORT = 3000;
const CONCURRENT_REQUESTS = [1, 5, 10, 20]; // Different concurrency levels to test
const REQUESTS_PER_SEARCH = 3; // How many times to run each search at each concurrency level

// Use all test searches by default, can be configured via environment variable
const USE_ALL_SEARCHES = process.env.USE_ALL_SEARCHES === 'true';
const SEARCH_QUERIES = USE_ALL_SEARCHES
  ? [...TEST_SEARCHES, ...ADDITIONAL_SEARCHES]
  : TEST_SEARCHES;

// Performance tracking
const results = [];
let totalRequests = 0;
let completedRequests = 0;

/**
 * Make a single search API request
 */
function makeSearchRequest(searchTerm, searchInfo) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    // Encode the search term for URL
    const encodedTerm = encodeURIComponent(searchTerm);
    const path = `/api/search?searchTerm=${encodedTerm}&limit=30&from=0`;

    const options = {
      hostname: HOST,
      port: PORT,
      path: path,
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'SearchLoadTest/1.0',
      },
    };

    const req = http.request(options, res => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        const endTime = Date.now();
        const duration = endTime - startTime;

        let resultCount = 0;
        let hasError = false;

        try {
          if (res.statusCode === 200) {
            const jsonData = JSON.parse(data);
            resultCount = jsonData.rows ? jsonData.rows.length : 0;
          }
        } catch (e) {
          hasError = true;
          console.error(`Failed to parse response for "${searchTerm}":`, e.message);
        }

        completedRequests++;
        const progress = ((completedRequests / totalRequests) * 100).toFixed(1);
        console.log(
          `[${progress}%] Request ${completedRequests}/${totalRequests} completed: "${searchTerm}" (${duration}ms, ${resultCount} results)`
        );

        resolve({
          searchTerm,
          description: searchInfo.description,
          complexity: searchInfo.complexity,
          duration,
          statusCode: res.statusCode,
          resultCount,
          hasError,
          timestamp: startTime,
        });
      });
    });

    req.on('error', error => {
      completedRequests++;
      console.error(`Error searching "${searchTerm}":`, error.message);
      reject(error);
    });

    req.setTimeout(30000, () => {
      completedRequests++;
      req.destroy();
      reject(new Error(`Timeout searching "${searchTerm}"`));
    });

    req.end();
  });
}

/**
 * Run a batch of concurrent search requests
 */
async function runConcurrentBatch(searches, concurrency) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Starting search batch with concurrency: ${concurrency}`);
  console.log(`${'='.repeat(80)}\n`);

  const batchResults = [];
  const batchStartTime = Date.now();

  // Create all request promises
  const allRequests = [];
  for (let i = 0; i < REQUESTS_PER_SEARCH; i++) {
    for (const search of searches) {
      allRequests.push({ search, iteration: i + 1 });
    }
  }

  // Execute in batches of specified concurrency
  for (let i = 0; i < allRequests.length; i += concurrency) {
    const batch = allRequests.slice(i, i + concurrency);
    const promises = batch.map(({ search }) =>
      makeSearchRequest(search.term, search).catch(error => ({
        searchTerm: search.term,
        description: search.description,
        complexity: search.complexity,
        duration: -1,
        error: error.message,
      }))
    );

    const batchResult = await Promise.all(promises);
    batchResults.push(...batchResult);
  }

  const batchEndTime = Date.now();
  const batchDuration = batchEndTime - batchStartTime;

  console.log(`\nBatch completed in ${batchDuration}ms\n`);

  return {
    concurrency,
    results: batchResults,
    totalDuration: batchDuration,
    avgRequestTime:
      batchResults.reduce((sum, r) => sum + (r.duration > 0 ? r.duration : 0), 0) /
      batchResults.length,
  };
}

/**
 * Analyze and print results
 */
function analyzeResults(allBatchResults) {
  console.log('\n' + '='.repeat(80));
  console.log('SEARCH PERFORMANCE LOAD TEST RESULTS');
  console.log('='.repeat(80));

  for (const batch of allBatchResults) {
    console.log(`\n--- Concurrency: ${batch.concurrency} ---`);
    console.log(`Total batch time: ${batch.totalDuration}ms`);
    console.log(`Average request time: ${batch.avgRequestTime.toFixed(2)}ms`);
    console.log(
      `Requests per second: ${(batch.results.length / (batch.totalDuration / 1000)).toFixed(2)}`
    );

    // Group by complexity
    const byComplexity = { low: [], medium: [], high: [] };
    batch.results.forEach(r => {
      if (r.duration > 0 && byComplexity[r.complexity]) {
        byComplexity[r.complexity].push(r.duration);
      }
    });

    console.log('\nPerformance by search complexity:');
    Object.keys(byComplexity).forEach(complexity => {
      const durations = byComplexity[complexity];
      if (durations.length > 0) {
        const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
        const min = Math.min(...durations);
        const max = Math.max(...durations);
        console.log(
          `  ${complexity.toUpperCase().padEnd(6)}: avg=${avg.toFixed(0)}ms, min=${min}ms, max=${max}ms (n=${durations.length})`
        );
      }
    });

    // Find slowest searches
    const slowest = [...batch.results]
      .filter(r => r.duration > 0)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5);

    console.log('\nTop 5 slowest searches:');
    slowest.forEach((r, i) => {
      console.log(
        `  ${i + 1}. "${r.searchTerm}" (${r.complexity}): ${r.duration}ms (${r.resultCount || 0} results)`
      );
    });

    // Find fastest searches
    const fastest = [...batch.results]
      .filter(r => r.duration > 0)
      .sort((a, b) => a.duration - b.duration)
      .slice(0, 5);

    console.log('\nTop 5 fastest searches:');
    fastest.forEach((r, i) => {
      console.log(
        `  ${i + 1}. "${r.searchTerm}" (${r.complexity}): ${r.duration}ms (${r.resultCount || 0} results)`
      );
    });

    // Result count analysis
    const withResults = batch.results.filter(r => r.resultCount > 0);
    if (withResults.length > 0) {
      const avgResults =
        withResults.reduce((sum, r) => sum + r.resultCount, 0) / withResults.length;
      console.log(
        `\nAverage result count: ${avgResults.toFixed(1)} (${withResults.length}/${batch.results.length} searches returned results)`
      );
    }
  }

  // Compare concurrency levels
  console.log('\n' + '='.repeat(80));
  console.log('CONCURRENCY COMPARISON');
  console.log('='.repeat(80));
  console.log('\nConcurrency | Avg Time | Throughput | Degradation');
  console.log('-'.repeat(60));

  const baseline = allBatchResults[0].avgRequestTime;
  allBatchResults.forEach(batch => {
    const degradation = ((batch.avgRequestTime / baseline - 1) * 100).toFixed(1);
    const throughput = (batch.results.length / (batch.totalDuration / 1000)).toFixed(2);
    console.log(
      `${String(batch.concurrency).padStart(11)} | ` +
        `${String(batch.avgRequestTime.toFixed(0)).padStart(8)}ms | ` +
        `${String(throughput).padStart(10)} rps | ` +
        `${degradation >= 0 ? '+' : ''}${degradation}%`
    );
  });

  // ElasticSearch performance summary
  console.log('\n' + '='.repeat(80));
  console.log('ELASTICSEARCH PERFORMANCE SUMMARY');
  console.log('='.repeat(80));
  console.log('\nTo extract ElasticSearch query times from server logs, run:');
  console.log('  grep "\\[PERF\\]\\[ES\\]" perf_logs.txt | grep "search.search"');
  console.log('\nTo analyze backend operation breakdown, run:');
  console.log('  python3 performance_analysis/scripts/analyze_backend.py perf_logs.txt');

  console.log('\n' + '='.repeat(80));
}

/**
 * Print test configuration
 */
function printTestConfiguration() {
  console.log('Search Performance Load Test');
  console.log('============================\n');
  console.log(`Server: http://${HOST}:${PORT}`);
  console.log(`Search queries to test: ${SEARCH_QUERIES.length}`);
  console.log(`Requests per search: ${REQUESTS_PER_SEARCH}`);
  console.log(`Concurrency levels: ${CONCURRENT_REQUESTS.join(', ')}`);

  totalRequests = SEARCH_QUERIES.length * REQUESTS_PER_SEARCH * CONCURRENT_REQUESTS.length;
  console.log(`Total requests: ${totalRequests}\n`);

  console.log('Search queries:');
  SEARCH_QUERIES.forEach((search, i) => {
    console.log(`  ${i + 1}. [${search.complexity.toUpperCase()}] "${search.term}"`);
    console.log(`     ${search.description}`);
  });
  console.log('');
}

/**
 * Main execution
 */
async function main() {
  printTestConfiguration();

  const allBatchResults = [];

  for (const concurrency of CONCURRENT_REQUESTS) {
    const batchResult = await runConcurrentBatch(SEARCH_QUERIES, concurrency);
    allBatchResults.push(batchResult);

    // Small delay between batches to let server recover
    if (concurrency < CONCURRENT_REQUESTS[CONCURRENT_REQUESTS.length - 1]) {
      console.log('Waiting 2 seconds before next batch...\n');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  analyzeResults(allBatchResults);

  console.log('\nSearch load test completed successfully!');
  console.log(`Results saved to server logs at: perf_logs.txt`);
  console.log('\nTo view detailed ElasticSearch timing:');
  console.log('  grep "ElasticSearch search.search" perf_logs.txt | tail -50');
}

// Handle errors
process.on('unhandledRejection', error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});

// Run the load test
main().catch(console.error);
