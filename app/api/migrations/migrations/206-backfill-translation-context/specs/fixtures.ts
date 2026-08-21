import { ObjectId } from 'mongodb';
import { Fixture } from '../types.js';

const ids = {
  completeSystemEn: new ObjectId(),
  incompleteSystemEs: new ObjectId(),
  incompleteFilters: new ObjectId(),
  completeCustomLabel: new ObjectId(),
  incompleteTemplate: new ObjectId(),
  incompleteThesaurus: new ObjectId(),
  incompleteRelationType: new ObjectId(),
  template: new ObjectId(),
  thesaurus: new ObjectId(),
  relationType: new ObjectId(),
};

const fixtures: Fixture = {
  templates: [{ _id: ids.template, name: 'Case' }],
  dictionaries: [{ _id: ids.thesaurus, name: 'Countries' }],
  relationtypes: [{ _id: ids.relationType, name: 'Related to' }],
  translationsV2: [
    {
      _id: ids.completeSystemEn,
      language: 'en',
      key: 'Search',
      value: 'Search',
      context: { id: 'System', type: 'Uwazi UI', label: 'User Interface' },
    },
    {
      _id: ids.incompleteSystemEs,
      language: 'es',
      key: 'Search',
      value: 'Buscar',
      context: { id: 'System' },
    },
    {
      _id: ids.incompleteFilters,
      language: 'fr',
      key: 'Filters',
      value: 'Filtres',
      context: { id: 'Filters' },
    },
    {
      _id: ids.completeCustomLabel,
      language: 'en',
      key: 'Password',
      value: 'Password',
      context: { id: 'Menu', type: 'Uwazi UI', label: 'Interface' },
    },
    {
      _id: ids.incompleteTemplate,
      language: 'en',
      key: 'title',
      value: 'Title',
      context: { id: ids.template.toHexString() },
    },
    {
      _id: ids.incompleteThesaurus,
      language: 'en',
      key: 'Countries',
      value: 'Countries',
      context: { id: ids.thesaurus.toHexString() },
    },
    {
      _id: ids.incompleteRelationType,
      language: 'en',
      key: 'Related to',
      value: 'Related to',
      context: { id: ids.relationType.toHexString() },
    },
  ],
};

export { fixtures, ids };
