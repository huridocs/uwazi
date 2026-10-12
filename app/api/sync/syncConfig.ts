import templates from '#api/core/v1_layer/templates/templates.js';
import { model as updateLog, UpdateLog } from '#api/updatelogs/index.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { readUpdateLogs } from '#api/core/infrastructure/postgresql/common/SyncLogWriter.js';
import { explicitOrdering } from '#shared/data_utils/arrayUtils.js';
import { PropertySchema } from '#shared/types/commonTypes.js';
import { SettingsSyncSchema, SettingsSyncTemplateSchema } from '#shared/types/settingsType.js';
import { syncedPromiseLoop } from '#shared/data_utils/promiseUtils.js';
import { ProcessNamespaces } from './processNamespaces.js';
import { syncs } from './syncs.js';

const removeDeletedTemplatesFromConfig = async (config: SettingsSyncSchema['config']) => {
  const newConfig = { ...config };
  const templatesIds = await templates.getAllIds();
  newConfig.templates = Object.keys(newConfig.templates || {}).reduce(
    (newTemplatesConfig, templateId) => {
      if (newTemplatesConfig && templatesIds.includes(templateId)) {
        // eslint-disable-next-line no-param-reassign
        newTemplatesConfig[templateId] = config.templates?.[templateId] || { properties: [] };
      }
      return newTemplatesConfig;
    },
    {} as SettingsSyncSchema['config']['templates']
  );
  return newConfig;
};

const getValuesFromTemplateProperties = async (
  config: SettingsSyncSchema['config'],
  validTypes: string[],
  valueProperty: keyof PropertySchema
) => {
  const templatesConfig = config.templates || {};

  return Object.keys(templatesConfig).reduce(
    async (prev, templateId) => {
      const validList = await prev;
      const template = await templates.getById(templateId);
      const templateConfig = templatesConfig[templateId];
      if (!templateConfig) {
        return Promise.resolve(validList);
      }
      const templateConfigProperties = templateConfig.properties;
      (template?.properties || []).forEach(property => {
        if (
          templateConfigProperties.includes(property._id?.toString() || '') &&
          validTypes.includes(property.type) &&
          property[valueProperty] &&
          property[valueProperty] !== undefined
        ) {
          // @ts-ignore
          validList.push(property[valueProperty].toString());
        }
      });

      return Promise.resolve(validList);
    },
    Promise.resolve([] as Array<string>)
  );
};

const COLLECTION_SYNC_ORDER = [
  'settings',
  'translationsV2',
  'dictionaries',
  'relationtypes',
  'templates',
  'files',
  'connections',
  'entities',
];
const TEMPLATE_DEPENDENCIES = [
  'settings',
  'entities',
  'files',
  'connections',
  'dictionaries',
  'translationsV2',
  'relationtypes',
];

const getApprovedCollections = (config: SettingsSyncSchema['config']) => {
  let collections = Object.keys(config);
  collections = collections.includes('templates')
    ? collections.concat(TEMPLATE_DEPENDENCIES)
    : collections;
  collections = explicitOrdering(COLLECTION_SYNC_ORDER, collections, true);

  return collections;
};

const getApprovedThesauri = async (config: SettingsSyncSchema['config']) =>
  getValuesFromTemplateProperties(config, ['select', 'multiselect'], 'content');

const getApprovedRelationtypes = async (config: SettingsSyncSchema['config']) => {
  const relationtypesConfig = config.relationtypes || [];
  const validTemplateRelationtypes = await getValuesFromTemplateProperties(
    config,
    ['relationship'],
    'relationType'
  );
  return relationtypesConfig.concat(validTemplateRelationtypes);
};

const lastChangesFromPostgres = async (
  collection: string,
  lastSync: number,
  limit: number
): Promise<UpdateLog[]> => {
  const transactionManager = ExecutionContext.postgresTransactionManager;
  const firstBatch = await readUpdateLogs(transactionManager, {
    namespace: collection,
    since: lastSync,
    limit,
  });

  if (!firstBatch.length) {
    return [];
  }

  const endTimestamp = firstBatch[firstBatch.length - 1].timestamp;
  const changes = await readUpdateLogs(transactionManager, {
    namespace: collection,
    since: lastSync,
    until: endTimestamp,
  });
  return changes as UpdateLog[];
};

export const createSyncConfig = async (
  config: SettingsSyncSchema,
  targetName: string,
  updateLogTargetCount: number = 50
) => {
  const cursor = await syncs.read(targetName);
  if (!cursor) {
    throw new Error(`Sync cursor "${targetName}" was not found`);
  }
  const { lastSyncs } = cursor;

  return {
    lastSyncs: lastSyncs || {},
    config: await removeDeletedTemplatesFromConfig(config.config),

    async lastChangesForCollection(collection: string, lastSync: number, limit: number) {
      if (ExecutionContext.currentTenant.featureFlags?.postgresCore) {
        return lastChangesFromPostgres(collection, lastSync, limit);
      }

      const firstBatch = await updateLog.find(
        {
          timestamp: { $gt: lastSync },
          namespace: collection,
        },
        undefined,
        {
          sort: { timestamp: 1 },
          limit,
          lean: true,
        }
      );

      if (!firstBatch.length) {
        return [];
      }

      const endTimestamp = firstBatch[firstBatch.length - 1].timestamp;

      return updateLog.find(
        {
          $and: [{ timestamp: { $gt: lastSync } }, { timestamp: { $lte: endTimestamp } }],
          namespace: collection,
        },
        undefined,
        {
          sort: {
            timestamp: 1,
          },
          lean: true,
        }
      );
    },

    async lastChanges() {
      const approvedCollections = getApprovedCollections(this.config);
      let currentLimit = updateLogTargetCount;
      const changes: UpdateLog[] = [];
      await syncedPromiseLoop(approvedCollections, async collection => {
        const lastSync = this.lastSyncs[collection] || 0;
        const collectionChanges = await this.lastChangesForCollection(
          collection,
          lastSync,
          currentLimit
        );
        changes.push(...collectionChanges);
        currentLimit -= collectionChanges.length;
        return currentLimit > 0;
      });
      return changes;
    },

    async shouldSync(change: UpdateLog) {
      if (change.deleted) return { skip: true };
      const templatesConfig = Object.fromEntries(
        Object.entries(this.config.templates ?? {}).filter(
          (entry): entry is [string, SettingsSyncTemplateSchema] => entry[1] !== undefined
        )
      );

      const relationtypesConfig = this.config.relationtypes || [];

      const whitelistedThesauri = await getApprovedThesauri(this.config);
      const whitelistedRelationtypes = await getApprovedRelationtypes(this.config);
      const processNamespaces = new ProcessNamespaces({
        change,
        templatesConfig,
        relationtypesConfig,
        whitelistedThesauri,
        whitelistedRelationtypes,
      });

      return processNamespaces.process();
    },
  };
};
