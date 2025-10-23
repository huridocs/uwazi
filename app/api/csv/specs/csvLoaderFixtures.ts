import db from 'api/utils/testing_db';
import { propertyTypes } from 'shared/propertyTypes';
import { templateUtils } from 'api/templates';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { TranslationDBO } from 'api/i18n.v2/schemas/TranslationDBO';
import { getFixturesFactory } from 'api/utils/fixturesFactory';

const template1Id = db.id();
const simpleTemplateId = db.id();
const multiSelectThesaurusId = db.id();
const thesauri1Id = db.id();
const templateToRelateId = db.id();
const templateWithGeneratedTitle = db.id();
const thesaurusWithSpacesId = db.id();

const createTranslationDBO = getFixturesFactory().v2.database.translationDBO;

const commonTranslationsV2 = (language: LanguageISO6391): TranslationDBO[] => [
  createTranslationDBO('multivalue1', 'multivalue1', language, {
    id: multiSelectThesaurusId.toString(),
    type: 'Thesaurus',
    label: 'multi_select_thesaurus',
  }),
  createTranslationDBO('multi_select_thesaurus', 'multi_select_thesaurus', language, {
    id: multiSelectThesaurusId.toString(),
    type: 'Thesaurus',
    label: 'multi_select_thesaurus',
  }),
  createTranslationDBO('thesauri1', 'thesauri1', language, {
    id: thesauri1Id.toString(),
    type: 'Thesaurus',
    label: 'thesauri1',
  }),
  createTranslationDBO('Group ', 'Group ', language, {
    id: thesaurusWithSpacesId.toString(),
    type: 'Thesaurus',
    label: 'thesaurus_with_spaces',
  }),
  createTranslationDBO('Item1', 'Item1', language, {
    id: thesaurusWithSpacesId.toString(),
    type: 'Thesaurus',
    label: 'thesaurus_with_spaces',
  }),
  createTranslationDBO(' Item2 ', ' Item2 ', language, {
    id: thesaurusWithSpacesId.toString(),
    type: 'Thesaurus',
    label: 'thesaurus_with_spaces',
  }),
  createTranslationDBO('Another Group', 'Another Group', language, {
    id: thesaurusWithSpacesId.toString(),
    type: 'Thesaurus',
    label: 'thesaurus_with_spaces',
  }),
  createTranslationDBO('Item3 ', 'Item3 ', language, {
    id: thesaurusWithSpacesId.toString(),
    type: 'Thesaurus',
    label: 'thesaurus_with_spaces',
  }),
  createTranslationDBO('Normal Group', 'Normal Group', language, {
    id: thesaurusWithSpacesId.toString(),
    type: 'Thesaurus',
    label: 'thesaurus_with_spaces',
  }),
  createTranslationDBO('Normal Item', 'Normal Item', language, {
    id: thesaurusWithSpacesId.toString(),
    type: 'Thesaurus',
    label: 'thesaurus_with_spaces',
  }),
  createTranslationDBO('original 3', 'original 3', language, {
    id: 'System',
    type: 'Uwazi UI',
    label: 'System',
  }),
  createTranslationDBO('original 2', 'original 2', language, {
    id: 'System',
    type: 'Thesaurus',
    label: 'System',
  }),
  createTranslationDBO('original 1', 'original 1', language, {
    id: 'System',
    type: 'Thesaurus',
    label: 'System',
  }),
];

export default {
  templates: [
    {
      _id: simpleTemplateId,
      name: 'Simple template',
      properties: [
        {
          _id: db.id(),
          type: propertyTypes.text,
          label: 'simple text field',
          name: templateUtils.safeName('simple text field'),
        },
        {
          _id: db.id(),
          type: propertyTypes.date,
          label: 'Date field',
          name: templateUtils.safeName('Date field'),
        },
      ],
    },
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
          _id: db.id(),
          type: propertyTypes.text,
          label: 'text label',
          name: templateUtils.safeName('text label'),
        },
        {
          _id: db.id(),
          type: propertyTypes.text,
          label: 'header.with. dots',
          name: templateUtils.safeName('header.with.dots'),
        },
        {
          _id: db.id(),
          type: propertyTypes.numeric,
          label: 'numeric label',
          name: templateUtils.safeName('numeric label'),
        },
        {
          _id: db.id(),
          type: propertyTypes.select,
          label: 'Select Label',
          name: templateUtils.safeName('select label'),
          content: thesauri1Id.toString(),
        },
        {
          _id: db.id(),
          type: 'non_defined_type',
          label: 'not defined type',
          name: templateUtils.safeName('not defined type'),
        },
        {
          _id: db.id(),
          type: propertyTypes.text,
          label: 'not configured on csv',
          name: templateUtils.safeName('not configured on csv'),
        },
        {
          _id: db.id(),
          type: propertyTypes.geolocation,
          label: 'geolocation',
          name: templateUtils.safeName('geolocation_geolocation'),
        },
        {
          _id: db.id(),
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
          _id: db.id(),
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
        {
          _id: db.id(),
          type: propertyTypes.text,
          label: 'Language',
          name: templateUtils.safeName('Language'),
        },
        {
          _id: db.id(),
          type: propertyTypes.select,
          label: 'Select with spaces',
          name: templateUtils.safeName('select_with_spaces'),
          content: thesaurusWithSpacesId.toString(),
        },
        {
          _id: db.id(),
          type: propertyTypes.multiselect,
          label: 'Multiselect with spaces',
          name: templateUtils.safeName('multiselect_with_spaces'),
          content: thesaurusWithSpacesId.toString(),
        },
      ],
    },
    {
      _id: templateWithGeneratedTitle,
      name: 'template with generated title',
      commonProperties: [
        {
          _id: db.id(),
          name: 'title',
          label: 'Title',
          type: 'text',
          generatedId: true,
        },
      ],
      properties: [
        {
          _id: db.id(),
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
    {
      _id: thesaurusWithSpacesId,
      name: 'thesaurus_with_spaces',
      values: [
        {
          label: 'Group ',
          id: db.id().toString(),
          values: [
            {
              label: 'Item1',
              id: db.id().toString(),
            },
            {
              label: ' Item2 ',
              id: db.id().toString(),
            },
          ],
        },
        {
          label: 'Another Group',
          id: db.id().toString(),
          values: [
            {
              label: 'Item3 ',
              id: db.id().toString(),
            },
          ],
        },
        {
          label: 'Normal Group',
          id: db.id().toString(),
          values: [
            {
              label: 'Normal Item',
              id: db.id().toString(),
            },
          ],
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

  translationsV2: [
    ...commonTranslationsV2('en'),
    ...commonTranslationsV2('es'),
    ...commonTranslationsV2('fr'),
  ],
};

export { template1Id, simpleTemplateId, templateWithGeneratedTitle, thesaurusWithSpacesId };
