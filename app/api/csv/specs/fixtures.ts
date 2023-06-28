import db, { DBFixture } from 'api/utils/testing_db';
import { propertyTypes } from 'shared/propertyTypes';
import { templateUtils } from 'api/templates';

const template1Id = db.id();
const thesauri1Id = db.id();
const templateToRelateId = db.id();

const fixtures: DBFixture = {
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
          _id: db.id(),
          type: propertyTypes.text,
          label: 'text label',
          name: templateUtils.safeName('text label'),
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
          label: 'select label',
          name: templateUtils.safeName('select label'),
          content: thesauri1Id,
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
      ],
    },
  ],

  dictionaries: [
    {
      _id: thesauri1Id,
      name: 'thesauri1',
      values: [
        {
          label: 'value1',
          id: db.id().toString(),
        },
        {
          label: 'value2',
          id: db.id().toString(),
        },
        {
          label: 'Value3',
          id: db.id().toString(),
        },
        {
          label: ' value4 ',
          id: db.id().toString(),
        },
      ],
    },
  ],

  settings: [
    {
      _id: db.id(),
      site_name: 'Uwazi',
      languages: [{ key: 'en', label: 'English', default: true }],
    },
  ],

  translations_v2: [
    {
      language: 'en',
      key: 'value1',
      value: 'value1',
      context: {
        id: thesauri1Id.toString(),
        type: 'Thesaurus',
        label: 'thesauri 1',
      },
    },
    {
      language: 'en',
      key: 'value2',
      value: 'value2',
      context: {
        id: thesauri1Id.toString(),
        type: 'Thesaurus',
        label: 'thesauri 1',
      },
    },
    {
      language: 'en',
      key: 'value3',
      value: 'value3',
      context: {
        id: thesauri1Id.toString(),
        type: 'Thesaurus',
        label: 'thesauri 1',
      },
    },
    {
      language: 'en',
      key: 'value4',
      value: 'value4',
      context: {
        id: thesauri1Id.toString(),
        type: 'Thesaurus',
        label: 'thesauri 1',
      },
    },
  ],
};

export { fixtures, template1Id, thesauri1Id, templateToRelateId };
