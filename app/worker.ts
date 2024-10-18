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
import { handleError } from './api/utils/handleError.js';
import { ATServiceListener } from 'api/externalIntegrations.v2/automaticTranslation/adapters/driving/ATServiceListener';

let dbAuth = {};

if (process.env.DBUSER) {
  dbAuth = {
    auth: { authSource: 'admin' },
    user: process.env.DBUSER,
    pass: process.env.DBPASS,
  };
}

const uncaughtError = (error: Error) => {
  handleError(error, { uncaught: true });
  process.exit(1);
};

process.on('unhandledRejection', uncaughtError);
process.on('uncaughtException', uncaughtError);

DB.connect(config.DBHOST, dbAuth)
  .then(async () => {
    await tenants.setupTenants();
    setupWorkerSockets();

    await tenants.run(async () => {
      permissionsContext.setCommandContext();

      console.info('==> 📡 starting external services...');
      ocrManager.start();
      new ATServiceListener().start();
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
        delayTimeBetweenTasks: 1000,
      }).start();
    });
  })
  .catch(error => {
    throw error;
  });
