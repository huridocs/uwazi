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

const baseSettingsFixture: DBFixture = {
  settings: [
    {
      _id: db.id(),
      site_name: 'Uwazi',
      languages: [{ key: 'en', label: 'English', default: true }],
    },
  ],
};

const linkFixtures: DBFixture = {
  settings: [
    {
      ...baseSettingsFixture.settings?.[0],
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
          type: 'group',
          sublinks: [
            {
              title: 'Sublink1',
              url: 'page/pageid/sublink1',
              type: 'link',
              localId: 'sublink1',
            },
            {
              title: 'Sublink2',
              url: 'page/pageid2/sublink2',
              type: 'link',
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
    type: 'group',
    sublinks: [
      {
        title: 'Sublink1',
        url: 'page/pageid/sublink1',
        type: 'link',
        localId: 'sublink1',
      },
      {
        title: 'Sublink2',
        url: 'page/pageid2/sublink2',
        type: 'link',
        localId: 'sublink2',
      },
    ],
  },
];

const newLinks = [
  {
    _id: factory.id('newLink'),
    title: 'newLink',
    type: 'link' as 'link',
    url: 'http://uwazi.io',
    sublinks: [],
  },
  {
    _id: factory.id('newGroup'),
    title: 'newGroup',
    type: 'group' as 'group',
    sublinks: [
      {
        title: 'newSubLink1',
        url: 'page/pageid/newSubLink1',
        type: 'link' as 'link',
        localId: 'newSubLink1Id',
      },
      {
        title: 'newSubLink2',
        url: 'page/pageid2/newSubLink2',
        type: 'link' as 'link',
      },
    ],
  },
  {
    _id: factory.id('newGroup2'),
    title: 'newGroup with empty sublinks',
    type: 'group' as 'group',
    sublinks: [],
  },
  {
    _id: factory.id('newLink2'),
    title: 'newLink with optional localId',
    type: 'link' as 'link',
    url: 'http://uwazi.io',
    localId: 'newLink2LocalId',
  },
];

export default fixtures;
export { baseSettingsFixture, expectedLinks, factory, linkFixtures, newLinks };
