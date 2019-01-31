import { models } from 'api/odm';
import { model as updateLog } from 'api/updatelogs';
import syncsModel from './syncsModel';

const sanitizeConfig = async config => Object.keys(config).reduce(async (prev, key) => {
  const sanitized = await prev;
  if (key === 'templates') {
    const templatesData = await models.templates.get({});

    sanitized.templates = Object.keys(config.templates).reduce((_templates, templateId) => {
      const templates = _templates;
      if (templatesData.find(t => t._id.toString() === templateId)) {
        templates[templateId] = config.templates[templateId];
      }
      return templates;
    }, {});
  } else {
    sanitized[key] = config[key];
  }

  return sanitized;
}, Promise.resolve({}));

const getApprovedCollections = (config) => {
  const whitelistedCollections = Object.keys(config);
  if (whitelistedCollections.includes('templates')) {
    whitelistedCollections.push('settings');
    whitelistedCollections.push('entities');
    whitelistedCollections.push('connections');
    whitelistedCollections.push('dictionaries');
    whitelistedCollections.push('translations');
    whitelistedCollections.push('relationtypes');
  }

  const blacklistedCollections = ['migrations', 'sessions'];

  return whitelistedCollections.filter(c => !blacklistedCollections.includes(c));
};

const oneSecond = 1000;

export default async (config) => {
  const [{ lastSync }] = await syncsModel.find();
  return {
    lastSync,

    config: await sanitizeConfig(config),

    async lastChanges() {
      return updateLog.find({
        timestamp: {
          $gte: lastSync - oneSecond
        },
        namespace: {
          $in: getApprovedCollections(this.config)
        }
      }, null, {
        sort: {
          timestamp: 1
        },
        lean: true
      });
    }
  };
};
