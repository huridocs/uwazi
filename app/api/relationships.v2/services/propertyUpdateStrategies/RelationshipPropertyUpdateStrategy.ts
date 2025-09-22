import { Template } from '../templates.v2/model/Template.js';

export interface RelationshipPropertyUpdateStrategy {
  update(candidateIds: string[]): Promise<void>;
  updateByTemplate(candidatesTemplate: Template['id']): Promise<void>;
}
