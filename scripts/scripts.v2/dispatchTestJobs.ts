import { config } from 'api/config';
import { DB } from 'api/odm';
import { DefaultDispatcher } from 'api/core/libs/queue/configuration/factories';
import { TestJob } from '../../app/queueRegistry';

(async () => {
  await DB.connect(config.DBHOST, config.DBAUTH);
  const dispatcher = await DefaultDispatcher(process.env.TENANT || 'default');
  for (let i = 0; i < 100; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await dispatcher.dispatch(TestJob, undefined);
  }
  await DB.disconnect();
})();
