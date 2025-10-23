import db from 'api/utils/testing_db';
import { Fixture } from '../types';

const fixtures: Fixture = {
  settings: [{ _id: db.id(), languages: [{ key: 'en' }, { key: 'es' }] }],
  translationsV2: [
    {
      _id: db.id(),
      language: 'en',
      context: { id: '1', label: 'Correct value', type: 'Relationship Type' },
      key: 'Correct value',
      value: 'Correct value',
    },
    {
      _id: db.id(),
      language: 'es',
      context: { id: '1', label: 'Valor correcto', type: 'Relationship Type' },
      key: 'Correct value',
      value: 'Correct value',
    },
    {
      _id: db.id(),
      language: 'en',
      context: { id: '2', label: 'Incorrect type 1', type: 'Connection' },
      key: 'Incorrect type 1',
      value: 'Incorrect type 1',
    },
    {
      _id: db.id(),
      language: 'es',
      context: { id: '2', label: 'Tipo incorrecto 1', type: 'Connection' },
      key: 'Incorrect type 1',
      value: 'Incorrect type 1',
    },
    {
      _id: db.id(),
      language: 'en',
      context: { id: '3', label: 'Incorrect type 2', type: 'Connection' },
      key: 'Incorrect type 2',
      value: 'Incorrect type 2',
    },
    {
      _id: db.id(),
      language: 'es',
      context: { id: '3', label: 'Tipo incorrecto 2', type: 'Connection' },
      key: 'Incorrect type 2',
      value: 'Incorrect type 2',
    },
    {
      _id: db.id(),
      language: 'en',
      context: { id: 'System', label: 'User Interface', type: 'Uwazi UI' },
      key: 'Im cool',
      value: 'Im cool',
    },
    {
      _id: db.id(),
      language: 'es',
      context: { id: 'System', label: 'User Interface', type: 'Uwazi UI' },
      key: 'Im cool',
      value: 'Im cool',
    },
  ],
};

export { fixtures };
