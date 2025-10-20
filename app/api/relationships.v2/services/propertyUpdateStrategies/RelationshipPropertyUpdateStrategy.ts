import { Template } from 'api/core/domain/template/Template';

export interface RelationshipPropertyUpdateStrategy {
  update(candidateIds: string[]): Promise<void>;
  updateByTemplate(candidatesTemplate: Template['id']): Promise<void>;
}
