import { Template } from 'api/templates.v2/model/Template';

export interface RelationshipPropertyUpdateStrategy {
  update(candidateIds: string[]): Promise<void>;
  updateByTemplate(candidatesTemplate: Template['id']): Promise<void>;
}
