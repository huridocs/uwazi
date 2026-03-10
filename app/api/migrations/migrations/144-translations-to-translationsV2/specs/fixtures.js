/** @format */
import db from 'api/utils/testing_db';

const entityTemplateId = db.id();
const documentTemplateId = db.id();
const englishTranslation = db.id();
const dictionaryId = db.id();

export default {
  translations: [
    {
      _id: englishTranslation,
      locale: 'en',
      contexts: [
        {
          _id: db.id(),
          id: 'System',
          label: 'System',
          type: 'Uwazi UI',
          values: [
            { key: 'Password', value: 'Password' },
            { key: 'Account', value: 'Account' },
            { key: 'Email', value: 'E-Mail' },
            { key: 'Age', value: 'Age' },
            { key: 'Library', value: 'Library' },
          ],
        },
        {
          _id: db.id(),
          id: 'Filters',
          label: 'Filters',
        },
        {
          _id: db.id(),
          id: 'Menu',
          label: 'Menu',
        },
        {
          _id: db.id(),
          id: entityTemplateId.toString(),
          label: 'Judge',
          values: [],
          type: 'Entity',
        },
        {
          _id: db.id(),
          id: documentTemplateId.toString(),
          label: 'Court order',
          values: [],
          type: 'Document',
        },
        {
          id: dictionaryId.toString(),
          type: 'Dictionary',
          values: [
            { key: 'dictionary 2', value: 'dictionary 2' },
            { key: 'Password', value: 'Password' },
            { key: 'Account', value: 'Account' },
            { key: 'Email', value: 'E-Mail' },
            { key: 'Age', value: 'Age' },
          ],
        },
      ],
    },
    {
      _id: db.id(),
      type: 'translation',
      locale: 'es',
      contexts: [
        {
          id: 'System',
          label: 'System',
          values: [
            { key: 'Password', value: 'Contraseña' },
            { key: 'Account', value: 'Cuenta' },
            { key: 'Email', value: 'Correo electronico' },
            { key: 'Age', value: 'Edad' },
          ],
        },
      ],
    },
    {
      _id: db.id(),
      type: 'translation',
      locale: 'zh',
      contexts: [
        {
          id: 'System',
          label: 'System',
          values: [
            { key: 'Password', value: 'Password' },
            { key: 'Account', value: 'Account' },
            { key: 'Email', value: 'Email' },
            { key: 'Age', value: 'Age' },
          ],
        },
      ],
    },
    {
      _id: db.id(),
      type: 'translation',
      locale: 'other',
      contexts: [],
    },
  ],
  settings: [
    {
      _id: db.id(),
      languages: [
        {
          key: 'es',
          label: 'Español',
        },
        {
          key: 'en',
          label: 'English',
          default: true,
        },
        {
          key: 'zh',
          label: 'Chinese',
          default: true,
        },
      ],
    },
  ],
  dictionaries: [
    {
      _id: dictionaryId,
      name: 'dictionary 2',
      values: [
        { id: '1', label: 'Password' },
        { id: '2', label: 'Account' },
        { id: '3', label: 'Email' },
        { id: 'age id', label: 'Age' },
      ],
    },
  ],
  templates: [
    {
      _id: entityTemplateId,
      type: 'template',
    },
    {
      _id: documentTemplateId,
      type: 'template',
    },
  ],
  updatelogs: [
    {
      namespace: 'test_namespace',
      deleted: false,
      mongoId: db.id(),
      timestamp: 1,
    },
  ],
};

export { entityTemplateId, englishTranslation, documentTemplateId, dictionaryId };
