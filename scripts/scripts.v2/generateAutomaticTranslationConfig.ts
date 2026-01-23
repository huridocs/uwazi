import { config } from '#api/config.js';
import { AutomaticTranslationFactory } from '#api/externalIntegrations.v2/automaticTranslation/AutomaticTranslationFactory.js';
import { DB } from '#api/odm/index.js';
import { tenants } from '#api/tenants/index.js';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

(async () => {
  const { configPath, tenant } = yargs(hideBin(process.argv))
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
    }).parseSync();

  const semanticConfig = (await import(configPath)).default;
  await DB.connect(config.DBHOST, config.DBAUTH);
  await tenants.setupTenants();
  await tenants.run(async () => {
    await AutomaticTranslationFactory.defaultGenerateATConfig().execute(semanticConfig);
  }, tenant);
  await tenants.tearDownTenants();
  await DB.disconnect();
})();
