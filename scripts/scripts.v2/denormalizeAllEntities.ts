import { config } from 'api/config';
import { DB } from 'api/odm';
import { tenants } from 'api/tenants';

import { denormalizeMetadata } from 'api/entities/denormalize';
import entities from 'api/entities/entities';
import entitiesModel from 'api/entities/entitiesModel';
import translationsModel, { IndexedTranslations } from 'api/i18n/translations';
import { permissionsContext } from 'api/permissions/permissionsContext';
import { search } from 'api/search';
import templates from 'api/core/v1_layer/templates';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { TemplateSchema } from 'shared/types/templateType';
import { ThesaurusSchema } from 'shared/types/thesaurusType';
import { inspect } from 'util';

const { tenant, allTenants } = require('yargs')
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
  }).argv;

async function handleTenant(tenantName: string) {
  await tenants.run(async () => {
    const start = process.hrtime();

    permissionsContext.setCommandContext();

    const templateRelatedThesauri: { [templateId: string]: Record<string, ThesaurusSchema> } = {};
    const indexedTemplates = await (
      await templates.get()
    ).reduce<Promise<{ [k: string]: TemplateSchema }>>(async (prev, t) => {
      let memo = await prev;
      memo[t._id.toString()] = t;
      templateRelatedThesauri[t._id.toString()] = await templates.getRelatedThesauri(t);
      return memo;
    }, Promise.resolve({}));

    const translationsByLanguage = (
      await translationsModel.get()
    ).reduce<{ [language: string]: IndexedTranslations }>((memo, t) => {
      if (!t.locale) {
        throw new Error(`translation ${t._id} has no locale !`);
      }
      memo[t.locale] = t;
      return memo;
    }, {});

    const allTemplates = Object.values(indexedTemplates);
    const entityIds = await entities.getUnrestricted({}, '_id', {});

    let entitiesProcessed = 0;
    const errors: any[] = [];

    await entityIds.reduce(async (prev, entity) => {
      await prev;
      const _id = entity._id;
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
        errors: errors,
      })
    );
  }, tenantName);
}

(async function run() {
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
  await tenants.model?.closeChangeStream();
  await DB.disconnect();
})();
