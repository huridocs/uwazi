#!/usr/bin/env node

/**
 * Load testing script for EntityView performance measurement
 * Tests multiple entities with varying relationship counts under concurrent load
 */

const http = require('http');

// Entities with high relationship counts (from database query)
const TEST_ENTITIES = [
  { sharedId: 'egfjcp0mp1w', relationships: 892, title: 'Observations on communications (EN)' },
  { sharedId: 'rbft3apinse', relationships: 892, title: 'Observations on communications (FR)' },
  { sharedId: 'mm95ay0ix4', relationships: 874, title: 'Observations on communications (ES)' },
  { sharedId: 'rfrw6wbn6d', relationships: 644, title: 'Observations 2019 (EN)' },
  { sharedId: '4pu4bwybbwj', relationships: 469, title: 'Oceans and law of the sea 2018' },
  { sharedId: '2rpox8umh35', relationships: 468, title: 'General disarmament 2001' },
  { sharedId: 'mcbck9t3xuj', relationships: 442, title: 'Oceans and law of the sea' },
  { sharedId: 'fqt8aa7zj5w', relationships: 437, title: 'Children and armed conflict' },
  { sharedId: 'blal00ukpl', relationships: 436, title: 'Oceans 2020' },
  { sharedId: 'dgkak61x7te', relationships: 434, title: 'Oceans 2018 v2' },
];

// Configuration
const HOST = 'localhost';
const PORT = 3000;
const CONCURRENT_REQUESTS = [1, 5, 10, 20]; // Different concurrency levels to test
const REQUESTS_PER_ENTITY = 3; // How many times to hit each entity at each concurrency level

// Performance tracking
const results = [];
let totalRequests = 0;
let completedRequests = 0;

/**
 * Make a single HTTP request to an entity page
 */
function makeRequest(entityId, entityInfo) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const options = {
      hostname: HOST,
      port: PORT,
      path: `/entity/${entityId}`,
      method: 'GET',
      headers: {
        Accept: 'text/html',
        'User-Agent': 'LoadTest/1.0',
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

        completedRequests++;
        const progress = ((completedRequests / totalRequests) * 100).toFixed(1);
        console.log(
          `[${progress}%] Request ${completedRequests}/${totalRequests} completed: ${entityId} (${duration}ms)`
        );

        resolve({
          entityId,
          relationships: entityInfo.relationships,
          title: entityInfo.title,
          duration,
          statusCode: res.statusCode,
          timestamp: startTime,
        });
      });
    });

    req.on('error', error => {
      completedRequests++;
      console.error(`Error requesting ${entityId}:`, error.message);
      reject(error);
    });

    req.setTimeout(30000, () => {
      completedRequests++;
      req.destroy();
      reject(new Error(`Timeout requesting ${entityId}`));
    });

    req.end();
  });
}

/**
 * Run a batch of concurrent requests
 */
async function runConcurrentBatch(entities, concurrency) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Starting batch with concurrency: ${concurrency}`);
  console.log(`${'='.repeat(80)}\n`);

  const batchResults = [];
  const batchStartTime = Date.now();

  // Create all request promises
  const allRequests = [];
  for (let i = 0; i < REQUESTS_PER_ENTITY; i++) {
    for (const entity of entities) {
      allRequests.push({ entity, iteration: i + 1 });
    }
  }

  // Execute in batches of specified concurrency
  for (let i = 0; i < allRequests.length; i += concurrency) {
    const batch = allRequests.slice(i, i + concurrency);
    const promises = batch.map(({ entity }) =>
      makeRequest(entity.sharedId, entity).catch(error => ({
        entityId: entity.sharedId,
        relationships: entity.relationships,
        title: entity.title,
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
  console.log('LOAD TEST RESULTS SUMMARY');
  console.log('='.repeat(80));

  for (const batch of allBatchResults) {
    console.log(`\n--- Concurrency: ${batch.concurrency} ---`);
    console.log(`Total batch time: ${batch.totalDuration}ms`);
    console.log(`Average request time: ${batch.avgRequestTime.toFixed(2)}ms`);
    console.log(
      `Requests per second: ${(batch.results.length / (batch.totalDuration / 1000)).toFixed(2)}`
    );

    // Group by relationship count
    const byRelCount = {};
    batch.results.forEach(r => {
      if (!byRelCount[r.relationships]) {
        byRelCount[r.relationships] = [];
      }
      byRelCount[r.relationships].push(r.duration);
    });

    console.log('\nPerformance by relationship count:');
    Object.keys(byRelCount)
      .sort((a, b) => Number(b) - Number(a))
      .forEach(count => {
        const durations = byRelCount[count].filter(d => d > 0);
        if (durations.length > 0) {
          const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
          const min = Math.min(...durations);
          const max = Math.max(...durations);
          console.log(
            `  ${count} relationships: avg=${avg.toFixed(0)}ms, min=${min}ms, max=${max}ms`
          );
        }
      });

    // Find slowest requests
    const slowest = [...batch.results]
      .filter(r => r.duration > 0)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5);

    console.log('\nTop 5 slowest requests:');
    slowest.forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.entityId} (${r.relationships} rels): ${r.duration}ms`);
    });
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
        `+${degradation}%`
    );
  });

  console.log('\n' + '='.repeat(80));
}

/**
 * Main execution
 */
async function main() {
  console.log('Entity Performance Load Test');
  console.log('============================\n');
  console.log(`Server: http://${HOST}:${PORT}`);
  console.log(`Entities to test: ${TEST_ENTITIES.length}`);
  console.log(`Requests per entity: ${REQUESTS_PER_ENTITY}`);
  console.log(`Concurrency levels: ${CONCURRENT_REQUESTS.join(', ')}`);

  totalRequests = TEST_ENTITIES.length * REQUESTS_PER_ENTITY * CONCURRENT_REQUESTS.length;
  console.log(`Total requests: ${totalRequests}\n`);

  const allBatchResults = [];

  for (const concurrency of CONCURRENT_REQUESTS) {
    const batchResult = await runConcurrentBatch(TEST_ENTITIES, concurrency);
    allBatchResults.push(batchResult);

    // Small delay between batches to let server recover
    if (concurrency < CONCURRENT_REQUESTS[CONCURRENT_REQUESTS.length - 1]) {
      console.log('Waiting 2 seconds before next batch...\n');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  analyzeResults(allBatchResults);

  console.log('\nLoad test completed successfully!');
  console.log(`Results saved to server logs at: perf_logs.txt`);
}

// Handle errors
process.on('unhandledRejection', error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});

// Run the load test
main().catch(console.error);
