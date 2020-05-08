import { DB } from 'api/odm';
import { tenants } from 'api/odm/tenantContext';

import migrator from './migrator';

const run = async () => {
  await DB.connect();
  await tenants.run(async () => {
    await migrator.migrate();
  });
  await DB.disconnect();
};

run().catch(async e => {
  await DB.disconnect();
  throw e;
});
