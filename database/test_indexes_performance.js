// Performance testing script for indexes
const { MongoClient } = require('mongodb');

const DB = process.env.DATABASE_NAME || 'uwazi_shared_db';
const HOST = process.env.DBHOST || '127.0.0.1';
const URI = `mongodb://${HOST}/${DB}`;

const AUTH = {};
if (process.env.DBUSER) {
  AUTH.auth = {
    user: process.env.DBUSER,
    password: process.env.DBPASS
  };
}

class RoundRobinQueueAdapter {
  constructor(db) {
    this.db = db;
    this.latestTenants = ['', ''];
  }

  async findAndUpdateJob(queueName, excludeTenants = []) {
    return this.db.collection('jobs').findOneAndUpdate(
      {
        queue: queueName,
        lockedUntil: { $lt: Date.now() },
        namespace: { $nin: excludeTenants }
      },
      [
        {
          $set: {
            lockedUntil: { $sum: [Date.now(), '$options.lockWindow'] },
            retryCount: { $add: ['$retryCount', 1] }
          }
        }
      ],
      { sort: { createdAt: 1 }, returnDocument: 'after' }
    );
  }

  async pickJob(queueName) {
    const result = await this.findAndUpdateJob(queueName, this.latestTenants);
    let job = null;
    if (result) {
      const { _id, ...withoutId } = result;
      job = {
        ...withoutId,
        id: _id.toHexString()
      };
    }
    if (job) {
      this.latestTenants.shift();
      this.latestTenants.push(job.namespace || '');
    }
    return job;
  }
}

async function generateTestData(db, numJobs = 1000000, numTenants = 10) {
  console.log('Generating test data...');
  
  // Generate tenant names
  const tenants = Array.from({ length: numTenants }, (_, i) => `tenant_${i}`);
  
  // Generate jobs in batches to avoid memory issues
  const batchSize = 5000;
  const batches = Math.ceil(numJobs / batchSize);
  
  // Clear existing data
  await db.collection('jobs').deleteMany({});
  await db.collection('jobs_failed').deleteMany({});
  await db.collection('tenants').deleteMany({});

  for (let batch = 0; batch < batches; batch++) {
    const jobs = [];
    const now = Date.now();
    const startIdx = batch * batchSize;
    const endIdx = Math.min(startIdx + batchSize, numJobs);
    
    for (let i = startIdx; i < endIdx; i++) {
      jobs.push({
        queue: 'test_queue',
        name: 'test_job',
        params: { test: true },
        namespace: tenants[i % tenants.length],
        lockedUntil: now - (i % 3 === 0 ? 1000 : -1000), // Some jobs are locked, some are not
        createdAt: now - i * 1000,
        retryCount: 0,
        options: {
          lockWindow: 30000,
          maxRetries: 3
        }
      });
    }

    await db.collection('jobs').insertMany(jobs);
    console.log(`Inserted batch ${batch + 1}/${batches} (${jobs.length} jobs)`);
  }

  await db.collection('tenants').insertMany(
    tenants.map(name => ({ name, dbName: name, indexName: name }))
  );

  console.log(`Generated ${numJobs} jobs and ${numTenants} tenants`);
}

async function testRoundRobinQuery(adapter, explain = false) {
  if (explain) {
    const query = {
      queue: 'test_queue',
      lockedUntil: { $lt: Date.now() },
      namespace: { $nin: adapter.latestTenants }
    };
    const explainResult = await adapter.db.collection('jobs').find(query).explain('executionStats');
    console.log('\nQuery Explanation:');
    console.log(JSON.stringify(explainResult, null, 2));
  }

  const start = Date.now();
  const result = await adapter.pickJob('test_queue');
  const end = Date.now();
  return { result, time: end - start };
}

async function testWithoutIndexes(db) {
  console.log('\nTesting without indexes...');
  
  // Drop indexes
  await db.collection('jobs').dropIndexes();
  await db.collection('jobs_failed').dropIndexes();
  await db.collection('tenants').dropIndexes();

  const adapter = new RoundRobinQueueAdapter(db);
  const { time } = await testRoundRobinQuery(adapter);
  console.log(`Time without indexes: ${time}ms`);
  
  return time;
}

async function testWithIndexes(db) {
  console.log('\nTesting with indexes...');
  
  // Create indexes for jobs collection
  await db.collection('jobs').createIndex({ queue: 1, lockedUntil: 1 }, { background: true });
  await db.collection('jobs').createIndex({ namespace: 1 }, { background: true });
  await db.collection('jobs').createIndex({ createdAt: 1 }, { background: true });
  
  // Create indexes for jobs_failed collection
  await db.collection('jobs_failed').createIndex({ queue: 1 }, { background: true });
  await db.collection('jobs_failed').createIndex({ namespace: 1 }, { background: true });
  await db.collection('jobs_failed').createIndex({ createdAt: 1 }, { background: true });
  
  // Create indexes for tenants collection
  await db.collection('tenants').createIndex({ name: 1 }, { unique: true, background: true });

  const adapter = new RoundRobinQueueAdapter(db);
  const { time } = await testRoundRobinQuery(adapter);
  console.log(`Time with indexes: ${time}ms`);
  
  return time;
}

async function runTests() {
  const client = new MongoClient(URI, AUTH);
  
  try {
    await client.connect();
    const db = client.db(DB);

    // Generate test data
    await generateTestData(db);

    // Run tests multiple times for better accuracy
    const iterations = 5;
    let totalTimeWithoutIndexes = 0;
    let totalTimeWithIndexes = 0;

    for (let i = 0; i < iterations; i++) {
      console.log(`\nIteration ${i + 1}/${iterations}`);
      
      const timeWithoutIndexes = await testWithoutIndexes(db);
      const timeWithIndexes = await testWithIndexes(db);
      
      totalTimeWithoutIndexes += timeWithoutIndexes;
      totalTimeWithIndexes += timeWithIndexes;
    }

    // Calculate averages
    const avgTimeWithoutIndexes = totalTimeWithoutIndexes / iterations;
    const avgTimeWithIndexes = totalTimeWithIndexes / iterations;
    const improvement = ((avgTimeWithoutIndexes - avgTimeWithIndexes) / avgTimeWithoutIndexes) * 100;

    console.log('\n=== Performance Test Results ===');
    console.log(`Average time without indexes: ${avgTimeWithoutIndexes.toFixed(2)}ms`);
    console.log(`Average time with indexes: ${avgTimeWithIndexes.toFixed(2)}ms`);
    console.log(`Performance improvement: ${improvement.toFixed(2)}%`);

    // Get query explanation for the last run with indexes
    console.log('\nAnalyzing query with indexes...');
    const adapter = new RoundRobinQueueAdapter(db);
    await testRoundRobinQuery(adapter, true);

  } catch (error) {
    console.error('Error running tests:', error);
  } finally {
    await client.close();
  }
}

runTests(); 