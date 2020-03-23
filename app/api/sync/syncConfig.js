import { models } from 'api/odm';
import { model as updateLog } from 'api/updatelogs';
import syncsModel from './syncsModel';

const sanitizeConfig = async config =>
  Object.keys(config).reduce(async (prev, key) => {
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

const getValuesFromTemplateProperties = async (config, validTypes, valueProperty) => {
  const templatesConfig = config.templates || {};

  return Object.keys(templatesConfig).reduce(async (prev, templateId) => {
    const validList = await prev;
    const template = await models.templates.getById(templateId);
    (template.properties || []).forEach(p => {
      if (templatesConfig[templateId].includes(p._id.toString()) && validTypes.includes(p.type)) {
        validList.push(p[valueProperty].toString());
      }
    });

    return Promise.resolve(validList);
  }, Promise.resolve([]));
};

const getApprovedCollections = config => {
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

const getApprovedThesauris = async config =>
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

const oneSecond = 1000;

export default async config => {
  const [{ lastSync }] = await syncsModel.find();

  return {
    lastSync,

    config: await sanitizeConfig(config),

    async lastChanges() {
      return updateLog.find(
        {
          timestamp: {
            $gte: lastSync - oneSecond,
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

      const whitelistedThesauris = await getApprovedThesauris(this.config);
      const whitelistedRelationtypes = await getApprovedRelationtypes(this.config);

      if (change.namespace === 'templates' && !templatesConfig[change.mongoId.toString()]) {
        return Promise.resolve();
      }

      if (
        change.namespace === 'dictionaries' &&
        !whitelistedThesauris.includes(change.mongoId.toString())
      ) {
        return Promise.resolve();
      }

      if (
        change.namespace === 'relationtypes' &&
        !whitelistedRelationtypes.includes(change.mongoId.toString())
      ) {
        return Promise.resolve();
      }

      let data = await models[change.namespace].getById(change.mongoId);

      if (change.namespace === 'settings') {
        data = { _id: data._id, languages: data.languages };
      }

      if (change.namespace === 'connections') {
        const entitiesData = await models.entities.get({ sharedId: data.entity });
        const entityTemplate = entitiesData[0].template.toString();

        const belongsToValidEntity = Object.keys(templatesConfig).includes(entityTemplate);
        if (!belongsToValidEntity) {
          return Promise.resolve();
        }

        const belongsToWhitelistedType = relationtypesConfig.includes(
          data.template ? data.template.toString() : null
        );

        const templateData = await models.templates.getById(entityTemplate);
        const templateHasValidRelationProperties = templateData.properties.reduce((isValid, p) => {
          if (
            p.type === 'relationship' &&
            templatesConfig[templateData._id.toString()].includes(p._id.toString())
          ) {
            return true;
          }

          return isValid;
        }, false);

        const isPossibleLeftMetadataRelationship =
          templateHasValidRelationProperties && !data.template;

        const hubOtherConnections = await models.connections.get({
          hub: data.hub,
          _id: { $ne: data._id },
        });
        const hubOtherEntities = await models.entities.get({
          sharedId: { $in: hubOtherConnections.map(h => h.entity) },
        });
        const hubTemplateIds = hubOtherEntities.map(h => h.template.toString());
        const hubWhitelistedTemplateIds = hubTemplateIds.filter(id =>
          Object.keys(templatesConfig).includes(id)
        );
        const hubOtherTemplates = await models.templates.get({
          _id: { $in: hubWhitelistedTemplateIds },
        });
        const isPosssbleRightMetadataRelationship = hubOtherTemplates.reduce(
          (_isRightRelationship, template) => {
            let isRightRelationship = _isRightRelationship;
            template.properties.forEach(p => {
              if (
                p.type === 'relationship' &&
                templatesConfig[template._id.toString()].includes(p._id.toString())
              ) {
                const belongsToType =
                  p.relationType.toString() === (data.template ? data.template.toString() : null);
                const belongsToSpecificContent =
                  p.content.toString() === templateData._id.toString();
                const belongsToGenericContent = p.content === '';
                if (belongsToType && (belongsToSpecificContent || belongsToGenericContent)) {
                  isRightRelationship = true;
                }
              }
            });

            return isRightRelationship;
          },
          false
        );

        if (
          !belongsToWhitelistedType &&
          !isPossibleLeftMetadataRelationship &&
          !isPosssbleRightMetadataRelationship
        ) {
          return Promise.resolve();
        }
      }

      if (change.namespace === 'translations') {
        const templatesData = await models.templates.get({
          _id: { $in: Object.keys(templatesConfig) },
        });

        data.contexts = data.contexts
          .map(_context => {
            const context = _context;

            const isSystem = context.id.toString() === 'System';
            const isApprovedRelationtype = whitelistedRelationtypes.includes(context.id.toString());
            const isApprovedThesauri = whitelistedThesauris.includes(context.id.toString());

            if (isSystem || isApprovedRelationtype || isApprovedThesauri) {
              return context;
            }

            if (Object.keys(templatesConfig).includes(context.id.toString())) {
              const contextTemplate = templatesData.find(
                t => t._id.toString() === context.id.toString()
              );
              const approvedKeys = [contextTemplate.name].concat(
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

      if (
        change.namespace === 'entities' &&
        !(data.template && Object.keys(templatesConfig).includes(data.template.toString()))
      ) {
        return Promise.resolve();
      }

      if (change.namespace === 'templates' && data.properties) {
        data.properties = data.properties.filter(property =>
          templatesConfig[data._id.toString()].includes(property._id.toString())
        );
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

      return data;
    },
  };
};
