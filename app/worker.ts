import { DB } from 'api/odm';
import { config } from 'api/config';
import { tenants } from 'api/tenants';
import { permissionsContext } from 'api/permissions/permissionsContext';
import { ocrManager } from 'api/services/ocr/OcrManager';
import { PDFSegmentation } from 'api/services/pdfsegmentation/PDFSegmentation';
import { DistributedLoop } from 'api/services/tasksmanager/DistributedLoop';
import { TwitterIntegration } from 'api/services/twitterintegration/TwitterIntegration';
import { preserveSync } from 'api/services/preserve/preserveSync';
import { tocService } from 'api/toc_generation/tocService';
import { syncWorker } from 'api/sync/syncWorker';
import { InformationExtraction } from 'api/services/informationextraction/InformationExtraction';
import { setupWorkerSockets } from 'api/socketio/setupSockets';
import { ConvertToPdfWorker } from 'api/services/convertToPDF/ConvertToPdfWorker';
import { QueueWorker } from 'api/queue.v2/application/QueueWorker';
import { Queue } from 'api/queue.v2/application/Queue';
import { StringJobSerializer } from 'api/queue.v2/infrastructure/StringJobSerializer';
import Redis from 'redis';
import RedisSMQ from 'rsmq';
import { registerUpdateRelationshipPropertiesJob } from 'api/relationships.v2/infrastructure/registerUpdateRelationshipPropertiesJob';

let dbAuth = {};

if (process.env.DBUSER) {
  dbAuth = {
    auth: { authSource: 'admin' },
    user: process.env.DBUSER,
    pass: process.env.DBPASS,
  };
}

function setUpJobsQueueWorker() {
  const redisClient = Redis.createClient(`redis://${config.redis.host}:${config.redis.port}`);
  const RSMQ = new RedisSMQ({ client: redisClient });
  const queue = new Queue('uwazi_jobs', RSMQ, StringJobSerializer);
  
  registerUpdateRelationshipPropertiesJob(queue);

  const queueWorker = new QueueWorker(queue);

  redisClient.on('ready', () => {
    // eslint-disable-next-line no-void
    void queueWorker.start();
  });
}

DB.connect(config.DBHOST, dbAuth)
  .then(async () => {
    await tenants.setupTenants();
    setupWorkerSockets();

    // eslint-disable-next-line max-statements
    await tenants.run(async () => {
      permissionsContext.setCommandContext();

      console.info('==> 📡 starting external services...');
      ocrManager.start();
      new InformationExtraction().start();

      new ConvertToPdfWorker().start();

      const segmentationConnector = new PDFSegmentation();
      segmentationConnector.start();
      const segmentationRepeater = new DistributedLoop(
        'segmentation_repeat',
        segmentationConnector.segmentPdfs,
        { port: config.redis.port, host: config.redis.host, delayTimeBetweenTasks: 5000 }
      );

      // eslint-disable-next-line no-void
      void segmentationRepeater.start();

      const twitterIntegration = new TwitterIntegration();
      twitterIntegration.start();
      const twitterRepeater = new DistributedLoop(
        'twitter_repeat',
        twitterIntegration.addTweetsRequestsToQueue,
        { port: config.redis.port, host: config.redis.host, delayTimeBetweenTasks: 120000 }
      );

      // eslint-disable-next-line no-void
      void twitterRepeater.start();

      // eslint-disable-next-line no-void
      void new DistributedLoop('preserve_integration', async () => preserveSync.syncAllTenants(), {
        port: config.redis.port,
        host: config.redis.host,
        delayTimeBetweenTasks: 30000,
      }).start();

      // eslint-disable-next-line no-void
      void new DistributedLoop('toc_service', async () => tocService.processAllTenants(), {
        port: config.redis.port,
        host: config.redis.host,
        delayTimeBetweenTasks: 30000,
      }).start();

      // eslint-disable-next-line no-void
      void new DistributedLoop('sync_job', async () => syncWorker.runAllTenants(), {
        port: config.redis.port,
        host: config.redis.host,
        delayTimeBetweenTasks: 30000,
      }).start();

      setUpJobsQueueWorker();
    });
  })
  .catch(error => {
    throw error;
  });
