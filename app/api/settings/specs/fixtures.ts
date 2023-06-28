import db, { DBFixture } from 'api/utils/testing_db';
import { propertyTypes } from 'shared/propertyTypes';
import { templateUtils } from 'api/templates';

const template1 = db.id();
const template2 = db.id();

const fixtures: DBFixture = {
  settings: [
    {
      _id: db.id(),
      site_name: 'Uwazi',
      allowedPublicTemplates: ['id1', 'id2'],
      languages: [
        { key: 'es', label: 'Spanish', default: true },
        { key: 'en', label: 'English' },
      ],
    },
  ],
  templates: [
    {
      _id: template1,
      name: 'template1',
      commonProperties: [{ name: 'title', label: 'title', type: 'text' }],
      properties: [
        {
          _id: db.id(),
          type: propertyTypes.numeric,
          label: 'براي',
          name: templateUtils.safeName('براي'),
        },
      ],
    },
    {
      _id: template2,
      name: 'template2',
      commonProperties: [{ name: 'title', label: 'title', type: 'text' }],
      properties: [
        {
          _id: db.id(),
          type: propertyTypes.text,
          label: 'país',
          name: 'pa_s',
        },
      ],
    },
  ],
  entities: [
    {
      template: template1,
      language: 'en',
      metadata: {
        [templateUtils.safeName('براي')]: [{ value: 'value' }],
      },
    },
    {
      template: template1,
      language: 'es',
      metadata: {
        [templateUtils.safeName('براي')]: [{ value: 'value' }],
      },
    },
    {
      template: template2,
      language: 'en',
      metadata: {
        pa_s: [{ value: 'pais' }],
      },
    },
    {
      template: template2,
      language: 'es',
      metadata: {
        pa_s: [{ value: 'pais' }],
      },
    },
  ],
};

export default fixtures;
