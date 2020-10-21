import { models } from 'api/odm';

const namespaces = [
  'settings',
  'templates',
  'entities',
  'connections',
  'files',
  'dictionaries',
  'relationtypes',
  'translations',
] as const;
type NamespaceNames = typeof namespaces[number];
type MethodNames = NamespaceNames | 'default';

interface Options {
  change: { namespace: NamespaceNames; mongoId: any };
  templatesConfig: any;
  relationtypesConfig: any;
  whitelistedThesauri: Array<string>;
  whitelistedRelationtypes: Array<string>;
}

const getEntityTemplate = async (sharedId: string) => {
  const entitiesData = await models.entities.get({ sharedId });
  return entitiesData[0].template.toString();
};

const extractAllowedMetadata = (data: any, templateData: any, templateConfig: any) => {
  if (data.metadata) {
    const templateConfigProperties = templateConfig.properties;
    const validPropertyNames = templateData.properties.reduce((memo: Array<any>, property: any) => {
      if (templateConfigProperties.includes(property._id.toString())) {
        memo.push(property.name);
      }
      return memo;
    }, []);

    return Object.keys(data.metadata).reduce((prevMetadata, propertyName) => {
      if (validPropertyNames.includes(propertyName)) {
        return { ...prevMetadata, [propertyName]: data.metadata[propertyName] };
      }
      return prevMetadata;
    }, {});
  }

  return undefined;
};

class ProcessNamespaces {
  change: Options['change'];

  templatesConfig: Options['templatesConfig'];

  relationtypesConfig: Options['relationtypesConfig'];

  templatesConfigKeys: Array<string>;

  whitelistedThesauri: Options['whitelistedThesauri'];

  whitelistedRelationtypes: Options['whitelistedRelationtypes'];

  constructor({
    change,
    templatesConfig,
    relationtypesConfig,
    whitelistedThesauri,
    whitelistedRelationtypes,
  }: Options) {
    this.change = change;
    this.templatesConfig = templatesConfig;
    this.relationtypesConfig = relationtypesConfig;
    this.templatesConfigKeys = Object.keys(templatesConfig);
    this.whitelistedThesauri = whitelistedThesauri;
    this.whitelistedRelationtypes = whitelistedRelationtypes;
  }

  private async fetchData() {
    const { namespace, mongoId } = this.change;
    return models[namespace].getById(mongoId);
  }

  private async getTemplateDataAndConfig(data: any) {
    const templateData = await models.templates.getById(data.template);
    const templateConfig = this.templatesConfig[templateData._id.toString()];
    return { templateData, templateConfig };
  }

  private assessTranslationApproved(context: any) {
    const isSystem = context.id.toString() === 'System';
    const isApprovedRelationtype = this.whitelistedRelationtypes.includes(context.id.toString());
    const isApprovedThesauri = this.whitelistedThesauri.includes(context.id.toString());

    return Boolean(isSystem || isApprovedRelationtype || isApprovedThesauri);
  }

  private isPossibleRightMetadataRel(data: any, templateData: any, hubOtherTemplates: any) {
    return hubOtherTemplates.reduce((_isRightRelationship: any, template: any) => {
      let isRightRelationship = _isRightRelationship;
      template.properties.forEach((p: any) => {
        if (
          p.type === 'relationship' &&
          this.templatesConfig[template._id.toString()].properties.includes(p._id.toString())
        ) {
          const belongsToType =
            p.relationType.toString() === (data.template ? data.template.toString() : null);
          const belongsToSpecificContent = p.content.toString() === templateData._id.toString();
          const belongsToGenericContent = p.content === '';
          if (belongsToType && (belongsToSpecificContent || belongsToGenericContent)) {
            isRightRelationship = true;
          }
        }
      });

      return isRightRelationship;
    }, false);
  }

  private async shouldSkipRel(
    data: any,
    templateData: any,
    templateHasValidRelationProperties: Boolean
  ) {
    const hubOtherConnections = await models.connections.get({
      hub: data.hub,
      _id: { $ne: data._id },
    });
    const hubOtherEntities = await models.entities.get({
      sharedId: { $in: hubOtherConnections.map(h => h.entity) },
    });
    const hubTemplateIds = hubOtherEntities.map(h => h.template.toString());
    const hubWhitelistedTemplateIds = hubTemplateIds.filter((id: string) =>
      this.templatesConfigKeys.includes(id)
    );
    const hubOtherTemplates = await models.templates.get({
      _id: { $in: hubWhitelistedTemplateIds },
    });

    const belongsToWhitelistedType = this.relationtypesConfig.includes(
      data.template ? data.template.toString() : null
    );
    const isPossibleLeftMetadataRel = templateHasValidRelationProperties && !data.template;
    const isPossibleRightMetadataRel = this.isPossibleRightMetadataRel(
      data,
      templateData,
      hubOtherTemplates
    );

    return !belongsToWhitelistedType && !isPossibleLeftMetadataRel && !isPossibleRightMetadataRel;
  }

  private async default() {
    const data = await this.fetchData();
    return { data };
  }

  private async settings() {
    const data = await this.fetchData();
    return { data: { _id: data._id, languages: data.languages } };
  }

  private async templates() {
    const templateConfig = this.templatesConfig[this.change.mongoId.toString()];

    if (!templateConfig) {
      return { skip: true };
    }

    const data = await this.fetchData();

    if (data.properties) {
      const templateConfigProperties = this.templatesConfig[data._id.toString()].properties;
      data.properties = data.properties.filter((property: any) =>
        templateConfigProperties.includes(property._id.toString())
      );
    }

    return { data };
  }

  private async entities() {
    const data = await this.fetchData();

    if (!(data.template && this.templatesConfigKeys.includes(data.template.toString()))) {
      return { skip: true };
    }

    const { templateData, templateConfig } = await this.getTemplateDataAndConfig(data);

    if (templateConfig.filter) {
      // eslint-disable-next-line no-new-func
      const filterFunction = new Function('data', templateConfig.filter);
      if (!filterFunction.call({}, JSON.parse(JSON.stringify(data)))) {
        return { skip: true };
      }
    }

    data.metadata = extractAllowedMetadata(data, templateData, templateConfig);

    return { data };
  }

  private async connections() {
    const data = await this.fetchData();
    const entityTemplate = await getEntityTemplate(data.entity);

    const belongsToValidEntity = this.templatesConfigKeys.includes(entityTemplate);
    if (!belongsToValidEntity) {
      return { skip: true };
    }

    const templateData = await models.templates.getById(entityTemplate);
    const templateConfigProps = this.templatesConfig[templateData._id.toString()].properties;
    const templateHasValidRelationProperties = templateData.properties.reduce(
      (hasValid: Boolean, p: any) => {
        const isValid = p.type === 'relationship' && templateConfigProps.includes(p._id.toString());
        return isValid || hasValid;
      },
      false
    );

    const shouldSkipRel = await this.shouldSkipRel(
      data,
      templateData,
      templateHasValidRelationProperties
    );

    return shouldSkipRel ? { skip: true } : { data };
  }

  private async files() {
    const data = await this.fetchData();
    if (data.entity) {
      const [entity] = await models.entities.get({ sharedId: data.entity });

      if (!this.templatesConfigKeys.includes(entity.template.toString())) {
        return { skip: true };
      }
    }

    return { data };
  }

  private async dictionaries() {
    if (!this.whitelistedThesauri.includes(this.change.mongoId.toString())) {
      return { skip: true };
    }

    return this.default();
  }

  private async relationtypes() {
    if (!this.whitelistedRelationtypes.includes(this.change.mongoId.toString())) {
      return { skip: true };
    }

    return this.default();
  }

  private async translations() {
    const data = await this.fetchData();
    const templatesData = await models.templates.get({
      _id: { $in: this.templatesConfigKeys },
    });

    data.contexts = data.contexts
      .map((context: any) => {
        if (this.assessTranslationApproved(context)) {
          return context;
        }

        if (this.templatesConfigKeys.includes(context.id.toString())) {
          const contextTemplate = templatesData.find(
            t => t._id.toString() === context.id.toString()
          );
          const templateConfigProperties = this.templatesConfig[context.id.toString()].properties;
          const approvedKeys = [contextTemplate.name].concat(
            contextTemplate.properties
              .filter((p: any) => templateConfigProperties.includes(p._id.toString()))
              .map((p: any) => p.label)
          );

          context.values = (context.values || []).filter((v: any) => approvedKeys.includes(v.key));
          return context;
        }

        return null;
      })
      .filter((c: any) => Boolean(c));

    return { data };
  }

  public async process() {
    const { namespace } = this.change;
    let method: MethodNames = namespace;
    if (!namespaces.includes(namespace)) {
      method = 'default';
    }
    return this[method]();
  }
}

export { ProcessNamespaces };
