import { ResultSet } from 'api/common.v2/contracts/ResultSet';
import { Property } from '../model/Property';
import { RelationshipProperty } from '../model/RelationshipProperty';
import { Template } from '../model/Template';
import { V1RelationshipProperty } from '../model/V1RelationshipProperty';

export interface TemplatesDataSource {
  getAll(): ResultSet<Template>;
  getAllTemplatesIds(): ResultSet<string>;
  getAllRelationshipProperties(): ResultSet<RelationshipProperty>;
  getV1RelationshipPropertiesByIds(ids?: string[]): ResultSet<V1RelationshipProperty>;
  getAllProperties(): ResultSet<Property>;
  getAllTextProperties(): ResultSet<Property>;
  getPropertyByName(name: string): Promise<Property>;
  getTemplatesIdsHavingProperty(propertyName: string): ResultSet<string>;
  getByIds(ids: Template['id'][]): ResultSet<Template>;
  getByNames(names: Template['name'][]): ResultSet<Template>;
  getById(id: Template['id']): Promise<Template | undefined>;
  getTemplatesByPropertyName(property: Property): Promise<Template[]>;
  incrementProcessingTracking(id: Template['id']): Promise<{ total: number; completed: number }>;
  completeProcessing(templateId: string): Promise<void>;
  setProcessingTotalJobs(templateId: string, totalJobs: number): Promise<void>;
  create(template: Template): Promise<void>;
  update(template: Template): Promise<void>;
  isPropertyUnique(property: Property): Promise<boolean>;
  isTemplateUnique(template: Template): Promise<boolean>;
}
