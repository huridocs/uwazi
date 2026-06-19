import { GenerateIdProperty } from '#api/core/domain/template/GenerateIdProperty.js';
import { ResultType } from '#api/core/libs/Result.js';
import {
  DefaultTemplateNotFoundError,
  TemplateDoesNotExistError,
} from '#api/core/domain/template/errors.js';
import { Property } from '../../domain/template/Property.js';
import { Template } from '../../domain/template/Template.js';
import { V1RelationshipProperty } from '../../domain/template/V1RelationshipProperty.js';

export interface TemplatesDataSource {
  updateMapping(template: Template, reset?: boolean): Promise<void>;
  getAll(): Promise<Template[]>;
  getAllTemplatesIds(): Promise<string[]>;
  getV1RelationshipPropertiesByIds(ids?: string[]): Promise<V1RelationshipProperty[]>;
  getGeneratedIdPropertiesByIds(ids?: string[]): Promise<GenerateIdProperty[]>;
  getAllProperties(): Promise<Property[]>;
  getPropertiesBeingInherited(properties: Property[]): Promise<Property[]>;
  getAllTextProperties(): Promise<Property[]>;
  getPropertyByName(name: string): Promise<Property>;
  getTemplatesIdsHavingProperty(propertyName: string): Promise<string[]>;
  getByIds(ids: Template['id'][]): Promise<Template[]>;
  getByNames(names: Template['name'][]): Promise<Template[]>;
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
  countByThesauri(thesaurusId: string): Promise<number>;
  delete(templateId: string): Promise<void>;
}
