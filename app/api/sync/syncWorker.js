import 'api/entities';

import urljoin from 'url-join';

import { models } from 'api/odm';
import { prettifyError } from 'api/utils/handleError';
import { model as updateLog } from 'api/updatelogs';
import errorLog from 'api/log/errorLog';
import request from 'shared/JSONRequest';
import settings from 'api/settings';

import syncsModel from './syncsModel';

const oneSecond = 1000;

const timeout = async interval => new Promise((resolve) => {
  setTimeout(resolve, interval);
});

const syncData = async (url, action, change, data) => {
  await request[action](urljoin(url, 'api/sync'), { namespace: change.namespace, data });
  return syncsModel.updateMany({}, { $set: { lastSync: change.timestamp } });
};

const getValuesFromTemplateProperties = async (config, validTypes, valueProperty) => {
  const templatesConfig = config.templates || {};

  return Object.keys(templatesConfig).reduce(async (prev, templateId) => {
    const validList = await prev;
    const template = await models.templates.getById(templateId);
    (template.properties || []).forEach((p) => {
      if (templatesConfig[templateId].includes(p._id.toString()) && validTypes.includes(p.type)) {
        validList.push(p[valueProperty].toString());
      }
    });

    return Promise.resolve(validList);
  }, Promise.resolve([]));
};

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

const getApprovedThesauris = async config => getValuesFromTemplateProperties(config, ['select', 'multiselect'], 'content');

const getApprovedRelationtypes = async (config) => {
  const relationtypesConfig = config.relationtypes || [];
  const validTemplateRelationtypes = await getValuesFromTemplateProperties(config, ['relationship'], 'relationType');
  return relationtypesConfig.concat(validTemplateRelationtypes);
};

export default {
  stopped: false,

  async syncronize({ url, config }) {
    const [{ lastSync }] = await syncsModel.find();
    const lastChanges = await updateLog.find({
      timestamp: {
        $gte: lastSync - oneSecond
      },
      namespace: {
        $in: getApprovedCollections(config)
      }
    }, null, {
      sort: {
        timestamp: 1
      },
      lean: true
    });

    const whitelistedThesauris = await getApprovedThesauris(config);
    const whitelistedRelationtypes = await getApprovedRelationtypes(config);

    await lastChanges.reduce(async (prev, change) => {
      await prev;

      if (change.deleted) {
        return syncData(url, 'delete', change, { _id: change.mongoId });
      }

      const templatesConfig = config.templates || {};
      const relationtypesConfig = config.relationtypes || [];

      if (change.namespace === 'templates' && !templatesConfig[change.mongoId.toString()]) {
        return Promise.resolve();
      }

      if (change.namespace === 'dictionaries' && !whitelistedThesauris.includes(change.mongoId.toString())) {
        return Promise.resolve();
      }

      if (change.namespace === 'relationtypes' && !whitelistedRelationtypes.includes(change.mongoId.toString())) {
        return Promise.resolve();
      }

      let data = await models[change.namespace].getById(change.mongoId);

      if (change.namespace === 'settings') {
        data = { _id: data._id, languages: data.languages };
      }

      if (change.namespace === 'connections') {
        const entityData = await models.entities.getById(data.entity);

        const belongsToValidEntity = Object.keys(templatesConfig).includes(entityData.template.toString());
        if (!belongsToValidEntity) {
          return Promise.resolve();
        }

        const belongsToWhitelistedType = relationtypesConfig.includes(data.template ? data.template.toString() : null);

        const templateData = await models.templates.getById(entityData.template);
        const templateHasValidRelationProperties = templateData.properties.reduce((isValid, p) => {
          if (p.type === 'relationship' && templatesConfig[templateData._id.toString()].includes(p._id.toString())) {
            return true;
          }

          return isValid;
        }, false);

        const isPossibleLeftMetadataRelationship = templateHasValidRelationProperties && !data.template;

        const hubOtherConnections = await models.connections.get({ hub: data.hub, _id: { $ne: data._id } });
        const hubOtherEntities = await models.entities.get({ _id: { $in: hubOtherConnections.map(h => h.entity) } });
        const hubTemplateIds = hubOtherEntities.map(h => h.template.toString());
        const hubWhitelistedTemplateIds = hubTemplateIds.filter(id => Object.keys(templatesConfig).includes(id));
        const hubOtherTemplates = await models.templates.get({ _id: { $in: hubWhitelistedTemplateIds } });
        const isPosssbleRightMetadataRelationship = hubOtherTemplates.reduce((_isRightRelationship, template) => {
          let isRightRelationship = _isRightRelationship;
          template.properties.forEach((p) => {
            if (p.type === 'relationship' && templatesConfig[template._id.toString()].includes(p._id.toString())) {
              const belongsToType = p.relationType.toString() === (data.template ? data.template.toString() : null);
              const belongsToSpecificContent = p.content.toString() === templateData._id.toString();
              const belongsToGenericContent = p.content === '';
              if (belongsToType && (belongsToSpecificContent || belongsToGenericContent)) {
                isRightRelationship = true;
              }
            }
          });

          return isRightRelationship;
        }, false);

        if (!belongsToWhitelistedType && !isPossibleLeftMetadataRelationship && !isPosssbleRightMetadataRelationship) {
          return Promise.resolve();
        }
      }

      if (change.namespace === 'translations') {
        const templatesData = await models.templates.get({ _id: { $in: Object.keys(templatesConfig) } });

        data.contexts = data.contexts
        .map((_context) => {
          const context = _context;

          const isSystem = context.id.toString() === 'System';
          const isApprovedRelationtype = whitelistedRelationtypes.includes(context.id.toString());
          const isApprovedThesauri = whitelistedThesauris.includes(context.id.toString());

          if (isSystem || isApprovedRelationtype || isApprovedThesauri) {
            return context;
          }

          if (Object.keys(templatesConfig).includes(context.id.toString())) {
            const contextTemplate = templatesData.find(t => t._id.toString() === context.id.toString());
            const approvedKeys = ([contextTemplate.name]).concat(
              contextTemplate.properties
              .filter(p => templatesConfig[context.id.toString()].includes(p._id.toString()))
              .map(p => p.label)
            );

            context.values = (context.values || []).filter(v => approvedKeys.includes(v.key));
            return context;
          }

          return null;
        })
        .filter(c => Boolean(c));
      }

      if (change.namespace === 'entities' && !Object.keys(templatesConfig).includes(data.template.toString())) {
        return Promise.resolve();
      }

      if (change.namespace === 'templates' && data.properties) {
        data.properties = data.properties.filter(property => templatesConfig[data._id.toString()].includes(property._id.toString()));
      }

      if (change.namespace === 'entities' && data.metadata) {
        const templateData = await models.templates.getById(data.template);

        const validPropertyNames = templateData.properties.reduce((memo, property) => {
          if (templatesConfig[templateData._id.toString()].includes(property._id.toString())) {
            memo.push(property.name);
          }
          return memo;
        }, []);

        data.metadata = Object.keys(data.metadata).reduce((_memo, propertyName) => {
          const memo = _memo;
          if (validPropertyNames.includes(propertyName)) {
            memo[propertyName] = data.metadata[propertyName];
          }
          return memo;
        }, {});
      }

      return syncData(url, 'post', change, data);
    }, Promise.resolve());
  },

  async intervalSync(config, interval = 5000) {
    if (this.stopped) {
      return;
    }
    try {
      await this.syncronize(config);
    } catch (e) {
      if (e.status === 401) {
        await this.login(config.url, 'admin', 'admin');
      } else {
        errorLog.error(prettifyError(e).prettyMessage);
      }
    }
    await timeout(interval);
    await this.intervalSync(config, interval);
  },

  async login(url, username, password) {
    try {
      const response = await request.post(urljoin(url, 'api/login'), { username, password });
      request.cookie(response.cookie);
    } catch (e) {
      errorLog.error(prettifyError(e).prettyMessage);
    }
  },

  async start(interval) {
    const { sync } = await settings.get();
    if (sync && sync.active) {
      const syncs = await syncsModel.find();
      if (syncs.length === 0) {
        await syncsModel.create({ lastSync: 0 });
      }
      this.intervalSync(sync, interval);
    }
  },

  stop() {
    this.stopped = true;
  }
};
