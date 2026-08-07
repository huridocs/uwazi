import { inspect } from 'util';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { config } from '#api/config.js';
import { DB } from '#api/odm/index.js';
import { tenants } from '#api/tenants/index.js';
import { denormalizeMetadata } from '#api/entities/denormalize.js';
import entities from '#api/entities/entities.js';
import entitiesModel from '#api/entities/entitiesModel.js';
import translationsModel, { IndexedTranslations } from '#api/i18n/translations.js';
import { permissionsContext } from '#api/permissions/permissionsContext.js';
import { search } from '#api/search/index.js';
import templates from '#api/core/v1_layer/templates/index.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { TemplateSchema } from '#shared/types/templateType.js';
import { ThesaurusSchema } from '#shared/types/thesaurusType.js';

const { tenant, allTenants } = yargs(hideBin(process.argv))
  .option('tenant', {
    alias: 't',
    type: 'string',
    describe: 'Tenant to use',
    default: 'default',
  })
  .option('allTenants', {
    alias: 'a',
    type: 'boolean',
    describe: 'All tenants',
    default: false,
  })
  .parseSync();

async function handleTenant(tenantName: string) {
  await tenants.run(async () => {
    const start = process.hrtime();

    permissionsContext.setCommandContext();

    const templateRelatedThesauri: { [templateId: string]: Record<string, ThesaurusSchema> } = {};
    const indexedTemplates = await (
      await templates.get()
    ).reduce<Promise<{ [k: string]: TemplateSchema }>>(async (prev, t) => {
      const memo = await prev;
      memo[t._id.toString()] = t;
      templateRelatedThesauri[t._id.toString()] = await templates.getRelatedThesauri(t);
      return memo;
    }, Promise.resolve({}));

    const translationsByLanguage = (await translationsModel.get()).reduce<{
      [language: string]: IndexedTranslations;
    }>((memo, t) => {
      if (!t.locale) {
        throw new Error(`translation ${t._id} has no locale !`);
      }
      // eslint-disable-next-line no-param-reassign
      memo[t.locale] = t;
      return memo;
    }, {});

    const allTemplates = Object.values(indexedTemplates);
    const entityIds = await entities.getUnrestricted({}, '_id', {});

    let entitiesProcessed = 0;
    const errors: any[] = [];

    await entityIds.reduce(async (prev, entity) => {
      await prev;
      const { _id } = entity;
      const [entityToSave] = await entities.getUnrestricted({ _id });
      try {
        console.log(
          JSON.stringify({ updating: `${entityToSave.title} | ${entityToSave.sharedId}` })
        );

        if (!entityToSave.template) {
          throw new Error(`Entity ${entityToSave._id} has no template !`);
        }

        if (!entityToSave.language) {
          throw new Error(`Entity ${entityToSave._id} has no language !`);
        }

        entityToSave.metadata = await denormalizeMetadata(
          entityToSave.metadata || {},
          entityToSave.language as LanguageISO6391,
          indexedTemplates[entityToSave.template.toString()],
          {
            thesauriByKey: templateRelatedThesauri[entityToSave.template.toString()],
            allTemplates,
            translation: translationsByLanguage[entityToSave.language],
          }
        );
        await entitiesModel.save(entityToSave);
        entitiesProcessed += 1;
      } catch (e) {
        const error = { tenant, sharedId: _id, error: inspect(e) };
        errors.push(error);
      }
      return Promise.resolve();
    }, Promise.resolve());

    await search.indexEntities({});

    const [seconds, nanoseconds] = process.hrtime(start);
    const elapsedTime = seconds + nanoseconds / 1e9;

    console.log(
      inspect({
        logType: 'summary',
        tenant: tenantName,
        entitiesFetched: entityIds.length,
        correctlyProcessed: entitiesProcessed,
        notProcessed: errors.length,
        elapsedTime: `${elapsedTime.toFixed(3)} s`,
        errors,
      })
    );
  }, tenantName);
}

async function cleanup() {
  await tenants.model?.closeChangeStream();
  await DB.disconnect();
}

async function run() {
  await DB.connect(config.DBHOST, config.DBAUTH);
  await tenants.setupTenants();

  if (!allTenants) {
    await handleTenant(tenant);
  } else {
    await Object.keys(tenants.tenants).reduce(async (prev, tenantName) => {
      await prev;
      await handleTenant(tenantName);
    }, Promise.resolve());
  }

  await cleanup();
}

run().catch(async error => {
  console.error(`denormalize-all-entities failed: ${error}`);
  await cleanup();
  process.exit(1);
});
