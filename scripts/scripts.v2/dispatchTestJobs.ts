import { config } from '#api/config.js';
import { DB } from '#api/odm/index.js';
import { DefaultDispatcher } from '#api/core/libs/queue/configuration/factories.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { TestJob } from '../../app/queueRegistry.js';

(async () => {
  await DB.connect(config.DBHOST, config.DBAUTH);
  const dispatcher = DefaultDispatcher(
    process.env.TENANT || 'default',
    TransactionManagerFactory.createForSharedDataBase()
  );
  for (let i = 0; i < 100; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await dispatcher.dispatch(TestJob, undefined);
  }
  await DB.disconnect();
})();
