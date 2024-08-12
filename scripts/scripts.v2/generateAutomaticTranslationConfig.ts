import { AutomaticTranslationFactory } from 'api/externalIntegrations.v2/automaticTranslation/AutomaticTranslationFactory';
import { DB } from 'api/odm';
import { tenants } from 'api/tenants';
import yargs from 'yargs';

const { config, tenant } = yargs
  .option('config', {
    alias: 'c',
    type: 'string',
    describe: 'Absolute path to json config file',
    required: true,
  })
  .option('tenant', {
    alias: 't',
    type: 'string',
    describe: 'Tenant to configure',
    default: 'default',
  }).argv;

let dbAuth = {};

if (process.env.DBUSER) {
  dbAuth = {
    auth: { authSource: 'admin' },
    user: process.env.DBUSER,
    pass: process.env.DBPASS,
  };
}

const semanticConfig = require(config);

(async () => {
  await DB.connect(config.DBHOST, dbAuth);
  await tenants.setupTenants();
  await tenants.run(async () => {
    await AutomaticTranslationFactory.defaultGenerateATConfig().execute(semanticConfig);
  }, tenant);
  process.exit();
  // await DB.disconnect();
})();
