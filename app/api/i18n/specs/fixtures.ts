/** @format */

import { TranslationDBO } from 'api/i18n.v2/schemas/TranslationDBO';
import { EnforcedWithId } from 'api/odm';
import db, { DBFixture } from 'api/utils/testing_db';
import { TranslationContext, TranslationType, TranslationValue } from 'shared/translationType';
import { LanguageISO6391 } from 'shared/types/commonTypes';

const entityTemplateId = db.id();
const documentTemplateId = db.id();
const englishTranslation = db.id();
const dictionaryId = db.id();

export const fixturesTranslationsV2ToTranslationsLegacy = (translations: TranslationDBO[]) => {
  const languageSet = new Set<LanguageISO6391>();
  translations.forEach(t => {
    languageSet.add(t.language);
  });
  const languageKeys = Array.from(languageSet);

  // const resultMap: { [language: string]: TranslationType & { locale: string } } = {};

  const resultMap = languageKeys.reduce<{
    [language: string]: TranslationType & { locale: string };
  }>((memo, key) => {
    // eslint-disable-next-line no-param-reassign
    memo[key] = { locale: key, contexts: [] };
    return memo;
  }, {});

  const contexts = languageKeys.reduce<{
    [language: string]: { [context: string]: TranslationContext & { values: TranslationValue[] } };
  }>((memo, key) => {
    // eslint-disable-next-line no-param-reassign
    memo[key] = {};
    return memo;
  }, {});

  translations.forEach(translation => {
    if (!resultMap[translation.language]) {
      resultMap[translation.language] = {
        locale: translation.language,
        contexts: [],
      };
      contexts[translation.language] = {};
    }
    if (!contexts[translation.language][translation.context.id]) {
      contexts[translation.language][translation.context.id] = {
        id: translation.context.id,
        label: translation.context.label,
        type: translation.context.type,
        values: [],
      };
    }
    contexts[translation.language][translation.context.id].values.push({
      key: translation.key,
      value: translation.value,
    });
  });

  return Object.values(resultMap).map(translation => {
    // eslint-disable-next-line no-param-reassign
    translation.contexts = Object.values(contexts[translation.locale]);
    return translation;
  }) as EnforcedWithId<TranslationType>[];
};

// eslint-disable-next-line camelcase
const translations_v2: DBFixture['translations_v2'] = [
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
];

const fixtures: DBFixture = {
  // eslint-disable-next-line camelcase
  // translations_v2,
  translations: fixturesTranslationsV2ToTranslationsLegacy(translations_v2),
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
