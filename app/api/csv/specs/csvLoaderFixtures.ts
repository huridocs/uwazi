import db from 'api/utils/testing_db';
import { propertyTypes } from 'shared/propertyTypes';
import { templateUtils } from 'api/templates';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { fixturesTranslationsV2ToTranslationsLegacy } from 'api/i18n/specs/fixturesTranslationsV2ToTranslationsLegacy';
import { TranslationDBO } from 'api/i18n.v2/schemas/TranslationDBO';

const template1Id = db.id();
const multiSelectThesaurusId = db.id();
const thesauri1Id = db.id();
const templateToRelateId = db.id();
const templateWithGeneratedTitle = db.id();

const commonTranslationsV2 = (language: LanguageISO6391): TranslationDBO[] => [
  {
    language,
    key: 'multivalue1',
    value: 'multivalue1',
    context: {
      id: multiSelectThesaurusId.toString(),
      type: 'Thesaurus',
      label: 'multi_select_thesaurus',
    },
  },
  {
    language,
    key: 'multi_select_thesaurus',
    value: 'multi_select_thesaurus',
    context: {
      id: multiSelectThesaurusId.toString(),
      type: 'Thesaurus',
      label: 'multi_select_thesaurus',
    },
  },
  {
    language,
    key: 'thesauri1',
    value: 'thesauri1',
    context: { id: thesauri1Id.toString(), type: 'Thesaurus', label: 'thesauri1' },
  },
  {
    language,
    key: 'original 3',
    value: 'original 3',
    context: { id: 'System', type: 'Uwazi UI', label: 'System' },
  },
  {
    language,
    key: 'original 2',
    value: 'original 2',
    context: { id: 'System', type: 'Thesaurus', label: 'System' },
  },
  {
    language,
    key: 'original 1',
    value: 'original 1',
    context: { id: 'System', type: 'Thesaurus', label: 'System' },
  },
];

export default {
  templates: [
    {
      _id: templateToRelateId,
      name: 'template to relate',
      properties: [],
    },
    {
      _id: template1Id,
      name: 'base template',
      properties: [
        {
          type: propertyTypes.text,
          label: 'text label',
          name: templateUtils.safeName('text label'),
        },
        {
          type: propertyTypes.numeric,
          label: 'numeric label',
          name: templateUtils.safeName('numeric label'),
        },
        {
          type: propertyTypes.select,
          label: 'Select Label',
          name: templateUtils.safeName('select label'),
          content: thesauri1Id.toString(),
        },
        {
          type: 'non_defined_type',
          label: 'not defined type',
          name: templateUtils.safeName('not defined type'),
        },
        {
          type: propertyTypes.text,
          label: 'not configured on csv',
          name: templateUtils.safeName('not configured on csv'),
        },
        {
          type: propertyTypes.geolocation,
          label: 'geolocation',
          name: templateUtils.safeName('geolocation_geolocation'),
        },
        {
          type: propertyTypes.generatedid,
          label: 'Auto ID',
          name: templateUtils.safeName('auto id'),
        },
        {
          _id: db.id(),
          type: propertyTypes.text,
          label: 'additional tag(s)',
          name: templateUtils.safeName('additional tag(s)', true),
        },
        {
          type: propertyTypes.multiselect,
          label: 'Multi Select Label',
          name: templateUtils.safeName('multi_select_label'),
          content: multiSelectThesaurusId.toString(),
        },
        {
          type: propertyTypes.date,
          label: 'Date label',
          name: templateUtils.safeName('Date label'),
        },
      ],
    },
    {
      _id: templateWithGeneratedTitle,
      name: 'template with generated title',
      commonProperties: [{ name: 'title', label: 'Title', type: 'text', generatedId: true }],
      properties: [
        {
          type: propertyTypes.numeric,
          label: 'numeric label',
          name: templateUtils.safeName('numeric label'),
        },
      ],
    },
  ],

  dictionaries: [
    {
      _id: thesauri1Id,
      name: 'thesauri1',
      values: [
        {
          label: ' value4 ',
          id: db.id().toString(),
        },
      ],
    },
    {
      _id: multiSelectThesaurusId,
      name: 'multi_select_thesaurus',
      values: [
        {
          label: 'multivalue1',
          id: db.id().toString(),
        },
      ],
    },
  ],

  settings: [
    {
      _id: db.id(),
      site_name: 'Uwazi',
      languages: [
        { key: 'en', label: 'English', default: true },
        { key: 'es', label: 'Spanish' },
        { key: 'fr', label: 'French' },
      ],
      newNameGeneration: true,
      dateFormat: 'dd/MM/yyyy',
    },
  ],

  translations: fixturesTranslationsV2ToTranslationsLegacy([
    ...commonTranslationsV2('en'),
    ...commonTranslationsV2('es'),
    ...commonTranslationsV2('fr'),
  ]),
};

export { template1Id, templateWithGeneratedTitle, thesauri1Id };
