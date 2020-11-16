import { models } from 'api/odm';
import { model as updateLog } from 'api/updatelogs';
import syncsModel from './syncsModel';
import { ProcessNamespaces } from './processNamespaces';

const sanitizeConfig = async config =>
  Object.keys(config).reduce(async (prev, key) => {
    const sanitized = await prev;
    if (key === 'templates') {
      const templatesData = await models.templates.get({});

      sanitized.templates = Object.keys(config.templates).reduce((templates, templateId) => {
        if (templatesData.find(t => t._id.toString() === templateId)) {
          const templateConfig = config.templates[templateId] || { properties: [] };
          const isArray = Array.isArray(templateConfig);
          const configObject = isArray ? { properties: templateConfig } : templateConfig;
          return { ...templates, [templateId]: configObject };
        }
        return templates;
      }, {});
    } else {
      sanitized[key] = config[key];
    }

    return sanitized;
  }, Promise.resolve({}));

const getValuesFromTemplateProperties = async (config, validTypes, valueProperty) => {
  const templatesConfig = config.templates || {};

  return Object.keys(templatesConfig).reduce(async (prev, templateId) => {
    const validList = await prev;
    const template = await models.templates.getById(templateId);
    const templateConfigProperties = templatesConfig[templateId].properties;
    (template.properties || []).forEach(p => {
      if (templateConfigProperties.includes(p._id.toString()) && validTypes.includes(p.type)) {
        validList.push(p[valueProperty].toString());
      }
    });

    return Promise.resolve(validList);
  }, Promise.resolve([]));
};

const getApprovedCollections = config => {
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

const getApprovedThesauri = async config =>
  getValuesFromTemplateProperties(config, ['select', 'multiselect'], 'content');

const getApprovedRelationtypes = async config => {
  const relationtypesConfig = config.relationtypes || [];
  const validTemplateRelationtypes = await getValuesFromTemplateProperties(
    config,
    ['relationship'],
    'relationType'
  );
  return relationtypesConfig.concat(validTemplateRelationtypes);
};

export default async (config, targetName) => {
  const [{ lastSync }] = await syncsModel.find({ name: targetName });

  return {
    lastSync,

    config: await sanitizeConfig(config),

    async lastChanges() {
      return updateLog.find(
        {
          timestamp: {
            $gt: lastSync,
          },
          namespace: {
            $in: getApprovedCollections(this.config),
          },
        },
        null,
        {
          sort: {
            timestamp: 1,
          },
          lean: true,
        }
      );
    },

    async shouldSync(change) {
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
