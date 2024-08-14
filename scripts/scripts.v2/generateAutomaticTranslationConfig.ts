import { config } from 'api/config';
import { AutomaticTranslationFactory } from 'api/externalIntegrations.v2/automaticTranslation/AutomaticTranslationFactory';
import { DB } from 'api/odm';
import { tenants } from 'api/tenants';
import yargs from 'yargs';

(async () => {
  const { configPath, tenant } = await yargs
    .option('configPath', {
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
  const semanticConfig = (await import(configPath)).default;
  await DB.connect(config.DBHOST, dbAuth);
  await tenants.setupTenants();
  await tenants.run(async () => {
    await AutomaticTranslationFactory.defaultGenerateATConfig().execute(semanticConfig);
  }, tenant);
  await tenants.tearDownTenants();
  await DB.disconnect();
})();
