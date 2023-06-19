export interface RelationshipPropertyUpdateStrategy {
  update(candidateIds: string[]): Promise<void>;
}
