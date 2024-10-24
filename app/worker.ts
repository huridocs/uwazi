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
      console.info('==> 📡 starting external services...');

      permissionsContext.setCommandContext();

      const stopList = [
        ocrManager.start(),
        new ATServiceListener().start(),
        new InformationExtraction().start(),
        new ConvertToPdfWorker().start(),
      ];

      const segmentationConnector = new PDFSegmentation();
      stopList.push(segmentationConnector.start());

      stopList.push(
        new DistributedLoop('segmentation_repeat', segmentationConnector.segmentPdfs, {
          port: config.redis.port,
          host: config.redis.host,
          delayTimeBetweenTasks: 5000,
        }).start()
      );

      const twitterIntegration = new TwitterIntegration();
      stopList.push(twitterIntegration.start());

      stopList.push(
        new DistributedLoop('twitter_repeat', twitterIntegration.addTweetsRequestsToQueue, {
          port: config.redis.port,
          host: config.redis.host,
          delayTimeBetweenTasks: 120000,
        }).start()
      );

      stopList.push(
        new DistributedLoop('preserve_integration', async () => preserveSync.syncAllTenants(), {
          port: config.redis.port,
          host: config.redis.host,
          delayTimeBetweenTasks: 30000,
        }).start()
      );

      stopList.push(
        new DistributedLoop('toc_service', async () => tocService.processAllTenants(), {
          port: config.redis.port,
          host: config.redis.host,
          delayTimeBetweenTasks: 30000,
        }).start()
      );

      stopList.push(
        new DistributedLoop('sync_job', async () => syncWorker.runAllTenants(), {
          port: config.redis.port,
          host: config.redis.host,
          delayTimeBetweenTasks: 1000,
        }).start()
      );

      process.on('SIGINT', async () => {
        console.log('Received SIGINT, waiting for graceful stop...');
        await Promise.all(stopList.map(async stop => stop()));
        console.log('Graceful stop process has finished, now exiting...');

        process.exit(0);
      });
    });
  })
  .catch(error => {
    throw error;
  });
