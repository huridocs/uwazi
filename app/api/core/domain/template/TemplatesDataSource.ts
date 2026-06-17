import { ResultSet } from '#api/core/application/contracts/ResultSet.js';
import { GenerateIdProperty } from '#api/core/domain/template/GenerateIdProperty.js';
import { ResultType } from '#api/core/libs/Result.js';
import {
  DefaultTemplateNotFoundError,
  TemplateDoesNotExistError,
} from '#api/core/domain/template/errors.js';
import { Property } from '../../domain/template/Property.js';
import { RelationshipProperty } from '#api/relationships.v2/model/RelationshipProperty.js';
import { Template } from '../../domain/template/Template.js';
import { V1RelationshipProperty } from '../../domain/template/V1RelationshipProperty.js';

export interface TemplatesDataSource {
  updateMapping(template: Template, reset?: boolean): Promise<void>;
  getAll(): ResultSet<Template>;
  getAllTemplatesIds(): ResultSet<string>;
  getAllRelationshipProperties(): ResultSet<RelationshipProperty>;
  getV1RelationshipPropertiesByIds(ids?: string[]): ResultSet<V1RelationshipProperty>;
  getGeneratedIdPropertiesByIds(ids?: string[]): ResultSet<GenerateIdProperty>;
  getAllProperties(): ResultSet<Property>;
  getPropertiesBeingInherited(properties: Property[]): Promise<Property[]>;
  getAllTextProperties(): ResultSet<Property>;
  getPropertyByName(name: string): Promise<Property>;
  getTemplatesIdsHavingProperty(propertyName: string): ResultSet<string>;
  getByIds(ids: Template['id'][]): ResultSet<Template>;
  getByNames(names: Template['name'][]): ResultSet<Template>;
  getById(id: string): Promise<ResultType<Template, TemplateDoesNotExistError>>;
  getTemplatesByPropertyName(property: Property): Promise<Template[]>;
  incrementProcessingTracking(id: Template['id']): Promise<{ total: number; completed: number }>;
  completeProcessing(templateId: string): Promise<void>;
  addJobsToProcessingCount(templateId: string, totalJobs: number): Promise<void>;
  create(template: Template): Promise<void>;
  update(template: Template): Promise<void>;
  bulkUpdate(template: Template[]): Promise<void>;
  isPropertyUnique(property: Property): Promise<boolean>;
  isTemplateUnique(template: Template): Promise<boolean>;
  getDefaultTemplate(): Promise<ResultType<Template, DefaultTemplateNotFoundError>>;
  findTemplatesReferencing(templateId: string): Promise<Template[]>;
  delete(templateId: string): Promise<void>;
}
