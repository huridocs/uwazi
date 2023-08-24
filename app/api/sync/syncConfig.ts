import { DataType } from 'api/odm';
import { SyncConfig } from 'api/sync/syncWorker';
import templatesModel from 'api/templates/templatesModel';
import { model as updateLog, UpdateLog } from 'api/updatelogs';
import { PropertySchema } from 'shared/types/commonTypes';
import { ProcessNamespaces } from './processNamespaces';
import syncsModel from './syncsModel';

const removeDeletedTemplatesFromConfig = async (config: SyncConfig['config']) => {
  const newConfig = { ...config };
  const templatesIds = (await templatesModel.get({}, { _id: 1 })).map(template =>
    template._id.toString()
  );
  newConfig.templates = Object.keys(newConfig.templates || {}).reduce(
    (newTemplatesConfig, templateId) => {
      if (newTemplatesConfig && templatesIds.includes(templateId)) {
        // eslint-disable-next-line no-param-reassign
        newTemplatesConfig[templateId] = config.templates?.[templateId] || { properties: [] };
      }
      return newTemplatesConfig;
    },
    {} as SyncConfig['config']['templates']
  );
  return newConfig;
};

const getValuesFromTemplateProperties = async (
  config: SyncConfig['config'],
  validTypes: string[],
  valueProperty: keyof PropertySchema
) => {
  const templatesConfig = config.templates || {};

  return Object.keys(templatesConfig).reduce(
    async (prev, templateId) => {
      const validList = await prev;
      const template = await templatesModel.getById(templateId);
      const templateConfigProperties = templatesConfig[templateId].properties;
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

const getApprovedCollections = (config: SyncConfig['config']) => {
  const collections = Object.keys(config);
  const whitelistedCollections = collections.includes('templates')
    ? collections.concat([
        'settings',
        'entities',
        'files',
        'connections',
        'dictionaries',
        'translations',
        'relationtypes',
      ])
    : collections;

  const blacklistedCollections = ['migrations', 'sessions'];

  return whitelistedCollections.filter(c => !blacklistedCollections.includes(c));
};

const getApprovedThesauri = async (config: SyncConfig['config']) =>
  getValuesFromTemplateProperties(config, ['select', 'multiselect'], 'content');

const getApprovedRelationtypes = async (config: SyncConfig['config']) => {
  const relationtypesConfig = config.relationtypes || [];
  const validTemplateRelationtypes = await getValuesFromTemplateProperties(
    config,
    ['relationship'],
    'relationType'
  );
  return relationtypesConfig.concat(validTemplateRelationtypes);
};

export const createSyncConfig = async (config: SyncConfig, targetName: string) => {
  const [{ lastSync }] = await syncsModel.find({ name: targetName });

  return {
    lastSync,
    config: await removeDeletedTemplatesFromConfig(config.config),

    async lastChanges() {
      const approvedCollections = getApprovedCollections(this.config);
      const firstBatch = await updateLog.find(
        {
          timestamp: { $gt: lastSync },
          namespace: { $in: approvedCollections },
        },
        undefined,
        {
          sort: { timestamp: 1 },
          limit: 50,
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
          namespace: { $in: approvedCollections },
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

    async shouldSync(change: DataType<UpdateLog>) {
      if (change.deleted) return { skip: true };
      const templatesConfig = this.config.templates || {};

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
