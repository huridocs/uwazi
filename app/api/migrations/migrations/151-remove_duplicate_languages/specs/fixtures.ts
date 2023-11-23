import { ObjectId } from 'mongodb';

import { Fixture } from '../types';

const settingsOnlyDuplication: Fixture = {
  settings: [
    {
      languages: [
        {
          label: 'English',
          key: 'en',
          default: true,
        },
        {
          label: 'Spanish',
          key: 'es',
        },
        {
          label: 'Spanish',
          key: 'es',
        },
      ],
    },
  ],
};

const defaultLanguageDuplication: Fixture = {
  settings: [
    {
      languages: [
        {
          label: 'English',
          key: 'en',
          default: true,
        },
        {
          label: 'Spanish',
          key: 'es',
        },
        {
          label: 'English',
          key: 'en',
        },
      ],
    },
  ],
};

const templateId = new ObjectId();

const fixture: Fixture = {
  settings: [
    {
      languages: [
        {
          label: 'English',
          key: 'en',
          default: true,
        },
        {
          label: 'Spanish',
          key: 'es',
        },
        {
          label: 'Spanish',
          key: 'es',
        },
      ],
    },
  ],
  pages: [
    {
      title: 'Correct page',
      language: 'en',
      sharedId: 'page1',
    },
    {
      title: 'Correct page',
      language: 'es',
      sharedId: 'page1',
    },
    {
      title: 'Duplicated in non default language',
      language: 'en',
      sharedId: 'page2',
    },
    {
      title: 'Duplicated in non default language',
      language: 'es',
      sharedId: 'page2',
    },
    {
      title: 'Duplicated in non default language',
      language: 'es',
      sharedId: 'page2',
    },
    {
      title: 'Duplicated in default language',
      language: 'en',
      sharedId: 'page3',
    },
    {
      title: 'Duplicated in default language',
      language: 'en',
      sharedId: 'page3',
    },
    {
      title: 'Duplicated in default language',
      language: 'es',
      sharedId: 'page3',
    },
    {
      title: 'Multiples in all languages',
      language: 'en',
      sharedId: 'page4',
    },
    {
      title: 'Multiples in all languages',
      language: 'en',
      sharedId: 'page4',
    },
    {
      title: 'Multiples in all languages',
      language: 'es',
      sharedId: 'page4',
    },
    {
      title: 'Multiples in all languages',
      language: 'es',
      sharedId: 'page4',
    },
    {
      title: 'Multiples in all languages',
      language: 'es',
      sharedId: 'page4',
    },
  ],
  templates: [
    {
      _id: templateId,
      name: 'template',
    },
  ],
  entities: [
    {
      title: 'Correct entity',
      template: templateId,
      language: 'en',
      sharedId: 'entity1',
    },
    {
      title: 'Correct entity',
      template: templateId,
      language: 'es',
      sharedId: 'entity1',
    },
    {
      title: 'Duplicated in non default language',
      template: templateId,
      language: 'en',
      sharedId: 'entity2',
    },
    {
      title: 'Duplicated in non default language',
      template: templateId,
      language: 'es',
      sharedId: 'entity2',
    },
    {
      title: 'Duplicated in non default language',
      template: templateId,
      language: 'es',
      sharedId: 'entity2',
    },
    {
      title: 'Duplicated in default language',
      template: templateId,
      language: 'en',
      sharedId: 'entity3',
    },
    {
      title: 'Duplicated in default language',
      template: templateId,
      language: 'en',
      sharedId: 'entity3',
    },
    {
      title: 'Duplicated in default language',
      template: templateId,
      language: 'es',
      sharedId: 'entity3',
    },
    {
      title: 'Multiples in all languages',
      template: templateId,
      language: 'en',
      sharedId: 'entity4',
    },
    {
      title: 'Multiples in all languages',
      template: templateId,
      language: 'en',
      sharedId: 'entity4',
    },
    {
      title: 'Multiples in all languages',
      template: templateId,
      language: 'es',
      sharedId: 'entity4',
    },
    {
      title: 'Multiples in all languages',
      template: templateId,
      language: 'es',
      sharedId: 'entity4',
    },
    {
      title: 'Multiples in all languages',
      template: templateId,
      language: 'es',
      sharedId: 'entity4',
    },
  ],
};

export { settingsOnlyDuplication, defaultLanguageDuplication, templateId, fixture };
