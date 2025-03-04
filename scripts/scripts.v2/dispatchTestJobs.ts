import { config } from 'api/config';
import { DB } from 'api/odm';
import { DefaultDispatcher } from 'api/queue.v2/configuration/factories';
import { TestJob } from '../../app/queueRegistry';

let dbAuth = {};

if (process.env.DBUSER) {
  dbAuth = {
    auth: { authSource: 'admin' },
    user: process.env.DBUSER,
    pass: process.env.DBPASS,
  };
}

(async () => {
  await DB.connect(config.DBHOST, dbAuth);
  const dispatcher = await DefaultDispatcher('default');
  for (let i = 0; i < 100; i += 1) {
    await dispatcher.dispatch(TestJob, {});
  }
  await DB.disconnect();
})();
