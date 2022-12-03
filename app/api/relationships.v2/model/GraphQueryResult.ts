export interface EntityData {
  _id: string;
  sharedId: string;
  title: string;
}

export interface RelationshipData {
  _id: string;
  type: string;
}

export class GraphQueryResult {
  readonly entities: EntityData[] = [];

  readonly relationships: RelationshipData[] = [];

  constructor(relationships: RelationshipData[], entities: EntityData[]) {
    this.relationships = relationships;
    this.entities = entities;
  }

  leaf() {
    return this.entities[this.entities.length - 1];
  }
}
