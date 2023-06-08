import { ValidationError } from 'api/common.v2/validation/ValidationError';
import { EntitiesDataSource } from 'api/entities.v2/contracts/EntitiesDataSource';
import { propertyTypes } from 'shared/propertyTypes';
import { MatchQueryNode, TemplateRecordElement } from 'api/relationships.v2/model/MatchQueryNode';
import { RelationshipTypesDataSource } from 'api/relationshiptypes.v2/contracts/RelationshipTypesDataSource';
import { RelationshipPropertyData } from 'shared/types/api.v2/templates.createTemplateRequest';
import { createError } from 'api/utils';
import { DenormalizationService } from 'api/relationships.v2/services/DenormalizationService';
import { TransactionManager } from 'api/common.v2/contracts/TransactionManager';
import { TemplatesDataSource } from '../contracts/TemplatesDataSource';
import { QueryMapper } from '../database/QueryMapper';
import { TemplateInput, TemplateInputMappers } from './TemplateInputMappers';
import { RelationshipProperty } from '../model/RelationshipProperty';
import { Template } from '../model/Template';

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

  private denormalizationService: DenormalizationService;

  private transactionManager: TransactionManager;

  constructor(
    templatesDataSource: TemplatesDataSource,
    relTypesDataSource: RelationshipTypesDataSource,
    entitiesDataSource: EntitiesDataSource,
    denormalizationService: DenormalizationService,
    transactionManager: TransactionManager
  ) {
    this.templatesDataSource = templatesDataSource;
    this.relTypesDataSource = relTypesDataSource;
    this.entitiesDataSource = entitiesDataSource;
    this.denormalizationService = denormalizationService;
    this.transactionManager = transactionManager;
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
    const query = TemplateInputMappers.queryToApp(property.query);
    await this.validateQuery(query, property.denormalizedProperty);
    return {
      ...property,
      query: QueryMapper.toDBO(query.getTraversals()),
    };
  }

  async validateUpdateActions(_oldTemplate: TemplateInput, _newTemplate: TemplateInput) {
    const oldTemplate = TemplateInputMappers.toApp(_oldTemplate);
    const newTemplate = TemplateInputMappers.toApp(_newTemplate);

    const updatedProperties = oldTemplate
      .selectUpdatedProperties(newTemplate)
      .filter(info => info.oldProperty.type === propertyTypes.newRelationship);

    const updatesDenormalizedProperty = updatedProperties.filter(info =>
      info.updatedAttributes.includes('denormalizedProperty')
    );

    if (updatesDenormalizedProperty.length) {
      throw createError(
        `Cannot update denormalized property of a relationship property. The following properties try to do so: ${updatesDenormalizedProperty
          .map(info => info.newProperty.name)
          .join(', ')}`,
        400
      );
    }
  }

  async handleRelationshipPropertyUpdates(oldTemplate: Template, newTemplate: Template) {
    await this.transactionManager.run(async () => {
      const newRelationshipNames = oldTemplate
        .selectNewProperties(newTemplate)
        .filter(p => p instanceof RelationshipProperty)
        .map(p => p.name);
      const updatedProperties = oldTemplate
        .selectUpdatedProperties(newTemplate)
        .filter(info => info.oldProperty.type === propertyTypes.newRelationship);

      const updatesQuery = updatedProperties
        .filter(info => info.updatedAttributes.includes('query'))
        .map(info => info.newProperty.name);

      const uniquePropertyNames = Array.from(new Set([...newRelationshipNames, ...updatesQuery]));

      await this.denormalizationService.denormalizeAfterCreatingOrUpdatingProperty(
        newTemplate.id,
        uniquePropertyNames
      );
    });
  }

  async templateIsUsedInQueries(templateId: string) {
    const relProps = this.templatesDataSource.getAllRelationshipProperties();
    return relProps.some(property => property.queryUsesTemplate(templateId));
  }

  async relationTypeIsUsedInQueries(typeId: string) {
    const relProps = this.templatesDataSource.getAllRelationshipProperties();
    return relProps.some(property => property.queryUsesRelationType(typeId));
  }
}
