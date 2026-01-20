interface TextReference {
  type: 'text';
  entity: string;
  file: string;
  selections: {
    page: number;
    top: number;
    left: number;
    width: number;
    height: number;
  }[];
  text: string;
}

interface EntityReference {
  type: 'entity';
  entity: string;
}

interface RelationshipData {
  from: EntityReference | TextReference;
  to: EntityReference | TextReference;
  type: string;
}

type CreateRelationshipData = RelationshipData[];

export type { TextReference, EntityReference, RelationshipData, CreateRelationshipData };
