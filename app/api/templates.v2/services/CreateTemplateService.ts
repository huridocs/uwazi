import { ValidationError } from 'api/common.v2/validation/ValidationError';
import { EntitiesDataSource } from 'api/entities.v2/contracts/EntitiesDataSource';
import { propertyTypes } from 'shared/propertyTypes';
import { MatchQueryNode, TemplateRecordElement } from 'api/relationships.v2/model/MatchQueryNode';
import { RelationshipTypesDataSource } from 'api/relationshiptypes.v2/contracts/RelationshipTypesDataSource';
import { RelationshipPropertyData } from 'shared/types/api.v2/templates.createTemplateRequest';
import { TemplatesDataSource } from '../contracts/TemplatesDataSource';
import { QueryMapper } from '../database/QueryMapper';
import { BuildQuery, TemplateInput, TemplateMappers } from '../database/TemplateMappers';
import { RelationshipProperty } from '../model/RelationshipProperty';

interface MatchQuery {
  templates: string[];
  traverse?: TraverseQuery[];
}

interface TraverseQuery {
  direction: 'in' | 'out';
  types: string[];
  match: MatchQuery[];
}

const expandAllTemplates = (allTemplatesIds: string[]) => (record: TemplateRecordElement) =>
  record.templates.length ? record : { ...record, templates: allTemplatesIds };

const validateTemplateExistence = (
  query: MatchQueryNode,
  errors: ValidationError['errors'],
  allTemplatesIds: string[]
) => {
  const templateIdSet = new Set(allTemplatesIds);

  const allQueryTemplates = query.getTemplates().map(expandAllTemplates(allTemplatesIds));
  allQueryTemplates.forEach(record => {
    const nonExisting = record.templates.filter(template => !templateIdSet.has(template));
    if (nonExisting.length) {
      errors.push({
        path: `/query/${record.path.join('/')}/templates`,
        message: `Templates ${nonExisting.join(', ')} do not exist.`,
      });
    }
  });
};

const validateRelTypeExistence = async (
  query: MatchQueryNode,
  errors: ValidationError['errors'],
  relTypeDS: RelationshipTypesDataSource
) => {
  const relTypeIds = await relTypeDS.getRelationshipTypeIds();
  const relTypeIdSet = new Set(relTypeIds);
  const allQueryRelationTypes = query.getRelationTypes().map(expandAllTemplates(relTypeIds));
  allQueryRelationTypes.forEach(record => {
    const nonExisting = record.templates.filter(template => !relTypeIdSet.has(template));
    if (nonExisting.length) {
      errors.push({
        path: `/query/${record.path.join('/')}/types`,
        message: `Relation types ${nonExisting.join(', ')} do not exist.`,
      });
    }
  });
};

const validateTemplatesInLeaves = async (
  query: MatchQueryNode,
  errors: ValidationError['errors'],
  denormalizedProperty: string,
  allTemplatesIds: string[],
  templatesDS: TemplatesDataSource
) => {
  const templatesInLeaves = query.getTemplatesInLeaves().map(expandAllTemplates(allTemplatesIds));

  const templatesHavingProperty = new Set(
    await templatesDS.getTemplatesIdsHavingProperty(denormalizedProperty).all()
  );

  templatesInLeaves.forEach(record => {
    if (!record.templates.every(template => templatesHavingProperty.has(template))) {
      errors.push({
        path: `/query/${record.path.join('/')}/templates`,
        message: 'template does not have the required property',
      });
    }
  });
};

const flushErrors = (errors: ValidationError['errors']) => {
  if (errors.length) {
    throw new ValidationError(errors);
  }
};

export class CreateTemplateService {
  private templatesDataSource: TemplatesDataSource;

  private relTypesDataSource: RelationshipTypesDataSource;

  private entitiesDataSource: EntitiesDataSource;

  constructor(
    templatesDataSource: TemplatesDataSource,
    relTypesDataSource: RelationshipTypesDataSource,
    entitiesDataSource: EntitiesDataSource
  ) {
    this.templatesDataSource = templatesDataSource;
    this.relTypesDataSource = relTypesDataSource;
    this.entitiesDataSource = entitiesDataSource;
  }

  private async validateQuery(query: MatchQueryNode, denormalizedProperty?: string) {
    const errors: ValidationError['errors'] = [];

    const allTemplatesIds = await this.templatesDataSource.getAllTemplatesIds().all();
    validateTemplateExistence(query, errors, allTemplatesIds);
    await validateRelTypeExistence(query, errors, this.relTypesDataSource);
    flushErrors(errors);

    if (!denormalizedProperty) {
      return;
    }

    await validateTemplatesInLeaves(
      query,
      errors,
      denormalizedProperty,
      allTemplatesIds,
      this.templatesDataSource
    );

    flushErrors(errors);
  }

  async createRelationshipProperty(property: RelationshipPropertyData) {
    const query = BuildQuery.build(property.query);
    await this.validateQuery(query, property.denormalizedProperty);
    return {
      ...property,
      query: QueryMapper.toDBO(query.getTraversals()),
    };
  }

  async markEntityMetadataAsObsolete(templateId: string, properties: string[]) {
    await this.entitiesDataSource.markMetadataAsChangedByTemplate(templateId, properties);
  }

  static readTemplateInput(template: TemplateInput) {
    return TemplateMappers.ApiToApp(template);
  }

  async handleRelationshipPropertyUpdates(
    _oldTemplate: TemplateInput,
    _newTemplate: TemplateInput
  ) {
    const oldTemplate = CreateTemplateService.readTemplateInput(_oldTemplate);
    const newTemplate = CreateTemplateService.readTemplateInput(_newTemplate);

    const newRelationshipNames = oldTemplate
      .selectNewProperties(newTemplate)
      .filter(p => p instanceof RelationshipProperty)
      .map(p => p.name);
    const updatedQueriesOrDenormalizations = oldTemplate
      .selectUpdatedProperties(newTemplate)
      .filter(info => info.oldProperty.type === propertyTypes.newRelationship)
      .filter(
        info =>
          info.updatedAttributes.includes('query') ||
          info.updatedAttributes.includes('denormalizedProperty')
      )
      .map(info => info.newProperty.name);

    await this.markEntityMetadataAsObsolete(
      newTemplate.id,
      Array.from(new Set([...newRelationshipNames, ...updatedQueriesOrDenormalizations]))
    );
  }

  async countQueriesUsingTemplate(templateId: string): Promise<number> {
    return this.templatesDataSource.countQueriesUsing(templateId);
  }
}
