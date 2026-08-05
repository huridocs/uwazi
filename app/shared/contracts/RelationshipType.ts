type RelationshipType = {
  _id: string;
  name: string;
};

type RelationshipTypeInput = Omit<RelationshipType, '_id'> & { _id?: string };

export type { RelationshipType, RelationshipTypeInput };
