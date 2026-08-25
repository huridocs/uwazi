import { ObjectId } from 'mongodb';
import { Fixture } from '../types.js';

const ids = {
  documentEn: new ObjectId(),
  documentEs: new ObjectId(),
  dictionaryEn: new ObjectId(),
  dictionaryPt: new ObjectId(),
  entityEn: new ObjectId(),
  thesaurusEn: new ObjectId(),
  uwaziUiEn: new ObjectId(),
  relationshipTypeEn: new ObjectId(),
};

const templateId = '58b2f3a35d59f31e1345b482';
const thesaurusId = '5a4d294c79f3f44b101e2816';

const fixtures: Fixture = {
  translationsV2: [
    {
      _id: ids.documentEn,
      language: 'en',
      key: 'Fecha',
      value: 'Date',
      context: {
        id: templateId,
        type: 'Document',
        label: 'Resolución de Presidencia de la CorteIDH',
      },
    },
    {
      _id: ids.documentEs,
      language: 'es',
      key: 'Fecha',
      value: 'Fecha',
      context: {
        id: templateId,
        type: 'Document',
        label: 'Resolución de Presidencia de la CorteIDH',
      },
    },
    {
      _id: ids.dictionaryEn,
      language: 'en',
      key: 'Country',
      value: 'Country',
      context: { id: thesaurusId, type: 'Dictionary', label: 'Countries' },
    },
    {
      _id: ids.dictionaryPt,
      language: 'pt',
      key: 'Country',
      value: 'País',
      context: { id: thesaurusId, type: 'Dictionary', label: 'Countries' },
    },
    {
      _id: ids.entityEn,
      language: 'en',
      key: 'Title',
      value: 'Title',
      context: { id: 'already-entity', type: 'Entity', label: 'Case' },
    },
    {
      _id: ids.thesaurusEn,
      language: 'en',
      key: 'Status',
      value: 'Status',
      context: { id: 'already-thesaurus', type: 'Thesaurus', label: 'Status' },
    },
    {
      _id: ids.uwaziUiEn,
      language: 'en',
      key: 'Search',
      value: 'Search',
      context: { id: 'System', type: 'Uwazi UI', label: 'User Interface' },
    },
    {
      _id: ids.relationshipTypeEn,
      language: 'en',
      key: 'Related to',
      value: 'Related to',
      context: { id: 'rel-type', type: 'Relationship Type', label: 'Related to' },
    },
  ],
};

export { fixtures, ids, templateId, thesaurusId };
