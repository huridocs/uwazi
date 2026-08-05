import type { RelationshipType } from '#shared/contracts/RelationshipType.js';

const relationshipTypes: RelationshipType[] = [
  { _id: 'reltype1', name: 'Related to' },
  { _id: 'reltype2', name: 'Mentions' },
  { _id: 'reltype3', name: 'Based on' },
];

const templateAtomValue = [
  {
    _id: 'template1',
    name: 'Document',
    properties: [
      {
        _id: 'property1',
        name: 'related',
        label: 'Related',
        type: 'relationship',
        relationType: 'reltype2',
      },
    ],
  },
];

export { relationshipTypes, templateAtomValue };
