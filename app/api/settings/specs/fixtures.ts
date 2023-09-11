import { templateUtils } from 'api/templates';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import db, { DBFixture } from 'api/utils/testing_db';
import { propertyTypes } from 'shared/propertyTypes';

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

const factory = getFixturesFactory();

const linkFixtures: DBFixture = {
  settings: [
    {
      _id: db.id(),
      site_name: 'Uwazi',
      languages: [{ key: 'en', label: 'English', default: true }],
      links: [
        {
          _id: factory.id('link'),
          title: 'Link',
          url: 'http://uwazi.io',
          sublinks: [],
          type: 'link',
        },
        {
          _id: factory.id('group'),
          title: 'Group',
          sublinks: [
            {
              title: 'Sublink1',
              url: 'page/pageid/sublink1',
              localId: 'sublink1',
            },
            {
              title: 'Sublink2',
              url: 'page/pageid2/sublink2',
              localId: 'sublink2',
            },
          ],
        },
      ],
    },
  ],
};

const expectedLinks = [
  {
    _id: factory.idString('link'),
    title: 'Link',
    url: 'http://uwazi.io',
    sublinks: [],
    type: 'link',
  },
  {
    _id: factory.idString('group'),
    title: 'Group',
    sublinks: [
      {
        title: 'Sublink1',
        url: 'page/pageid/sublink1',
        localId: 'sublink1',
      },
      {
        title: 'Sublink2',
        url: 'page/pageid2/sublink2',
        localId: 'sublink2',
      },
    ],
  },
];

export default fixtures;
export { expectedLinks, factory, linkFixtures };
