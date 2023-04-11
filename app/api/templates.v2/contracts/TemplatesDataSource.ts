import { ResultSet } from 'api/common.v2/contracts/ResultSet';
import { Property } from '../model/Property';
import { RelationshipProperty } from '../model/RelationshipProperty';
import { Template } from '../model/Template';

export interface TemplatesDataSource {
  getAllTemplatesIds(): ResultSet<string>;
  getAllRelationshipProperties(): ResultSet<RelationshipProperty>;
  getAllProperties(): ResultSet<Property>;
  getPropertyByName(name: string): Promise<Property>;
  getTemplatesIdsHavingProperty(propertyName: string): ResultSet<string>;
  getAllTemplates(): Promise<Template[]>;
  getTemplateIdIndex(): Promise<Record<string, Template>>;
  countQueriesUsing(templateId: string): Promise<number>;
}
