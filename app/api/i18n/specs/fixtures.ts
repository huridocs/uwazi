/** @format */

import db, { DBFixture } from 'api/utils/testing_db';

const entityTemplateId = db.id();
const documentTemplateId = db.id();
const englishTranslation = db.id();
const dictionaryId = db.id();

const fixtures: DBFixture = {
  translations_v2: [
    {
      language: 'zh',
      key: 'Age',
      value: 'Age',
      context: { id: 'System', label: 'System', type: 'Uwazi UI' },
    },
    {
      language: 'zh',
      key: 'Library',
      value: 'Library',
      context: { id: 'System', label: 'System', type: 'Uwazi UI' },
    },
    {
      language: 'zh',
      key: 'Email',
      value: 'Email',
      context: { id: 'System', label: 'System', type: 'Uwazi UI' },
    },
    {
      language: 'zh',
      key: 'Account',
      value: 'Account',
      context: { id: 'System', label: 'System', type: 'Uwazi UI' },
    },
    {
      language: 'zh',
      key: 'Password',
      value: 'Password',
      context: { id: 'System', label: 'System', type: 'Uwazi UI' },
    },
    {
      language: 'zh',
      key: 'Age',
      value: 'Edad',
      context: { id: dictionaryId.toString(), label: 'Dictionary', type: 'Thesaurus' },
    },
    {
      language: 'zh',
      key: 'Email',
      value: 'E-Mail',
      context: { id: dictionaryId.toString(), label: 'Dictionary', type: 'Thesaurus' },
    },
    {
      language: 'zh',
      key: 'Account',
      value: 'Cuenta',
      context: { id: dictionaryId.toString(), label: 'Dictionary', type: 'Thesaurus' },
    },
    {
      language: 'zh',
      key: 'Password',
      value: 'Contraseña',
      context: { id: dictionaryId.toString(), label: 'Dictionary', type: 'Thesaurus' },
    },
    {
      language: 'zh',
      key: 'dictionary 2',
      value: 'dictionary 2',
      context: { id: dictionaryId.toString(), label: 'Dictionary', type: 'Thesaurus' },
    },
    {
      language: 'es',
      key: 'Age',
      value: 'Edad',
      context: { id: dictionaryId.toString(), label: 'Dictionary', type: 'Thesaurus' },
    },
    {
      language: 'es',
      key: 'Email',
      value: 'E-Mail',
      context: { id: dictionaryId.toString(), label: 'Dictionary', type: 'Thesaurus' },
    },
    {
      language: 'es',
      key: 'Account',
      value: 'Cuenta',
      context: { id: dictionaryId.toString(), label: 'Dictionary', type: 'Thesaurus' },
    },
    {
      language: 'es',
      key: 'Password',
      value: 'Contraseña',
      context: { id: dictionaryId.toString(), label: 'Dictionary', type: 'Thesaurus' },
    },
    {
      language: 'es',
      key: 'dictionary 2',
      value: 'dictionary 2',
      context: { id: dictionaryId.toString(), label: 'Dictionary', type: 'Thesaurus' },
    },
    {
      language: 'es',
      key: 'Age',
      value: 'Edad',
      context: { id: 'System', label: 'System', type: 'Uwazi UI' },
    },
    {
      language: 'es',
      key: 'Email',
      value: 'Correo electronico',
      context: { id: 'System', label: 'System', type: 'Uwazi UI' },
    },
    {
      language: 'es',
      key: 'Account',
      value: 'Cuenta',
      context: { id: 'System', label: 'System', type: 'Uwazi UI' },
    },
    {
      language: 'es',
      key: 'Password',
      value: 'Contraseña',
      context: { id: 'System', label: 'System', type: 'Uwazi UI' },
    },
    {
      language: 'es',
      key: 'Library',
      value: 'Library',
      context: { id: 'System', label: 'System', type: 'Uwazi UI' },
    },
    {
      language: 'en',
      key: 'Age',
      value: 'Age',
      context: { id: dictionaryId.toString(), label: 'Dictionary', type: 'Thesaurus' },
    },
    {
      language: 'en',
      key: 'Email',
      value: 'E-Mail',
      context: { id: dictionaryId.toString(), label: 'Dictionary', type: 'Thesaurus' },
    },
    {
      language: 'en',
      key: 'Account',
      value: 'Account',
      context: { id: dictionaryId.toString(), label: 'Dictionary', type: 'Thesaurus' },
    },
    {
      language: 'en',
      key: 'Password',
      value: 'Password',
      context: { id: dictionaryId.toString(), label: 'Dictionary', type: 'Thesaurus' },
    },
    {
      language: 'en',
      key: 'dictionary 2',
      value: 'dictionary 2',
      context: { id: dictionaryId.toString(), label: 'Dictionary', type: 'Thesaurus' },
    },
    {
      language: 'en',
      key: 'Library',
      value: 'Library',
      context: { id: 'System', label: 'System', type: 'Uwazi UI' },
    },
    {
      language: 'en',
      key: 'Age',
      value: 'Age',
      context: { id: 'System', label: 'System', type: 'Uwazi UI' },
    },
    {
      language: 'en',
      key: 'Email',
      value: 'E-Mail',
      context: { id: 'System', label: 'System', type: 'Uwazi UI' },
    },
    {
      language: 'en',
      key: 'Account',
      value: 'Account',
      context: { id: 'System', label: 'System', type: 'Uwazi UI' },
    },
    {
      language: 'en',
      key: 'Password',
      value: 'Password',
      context: { id: 'System', label: 'System', type: 'Uwazi UI' },
    },
  ],
  translations: [],
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
};

export default fixtures;
export { entityTemplateId, englishTranslation, documentTemplateId, dictionaryId };
