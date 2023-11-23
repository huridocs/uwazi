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

const allCases: Fixture = {
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
        {
          label: 'French',
          key: 'fr',
        },
        {
          label: 'French',
          key: 'fr',
        },
        {
          label: 'French',
          key: 'fr',
        },
      ],
    },
  ],
  pages: [
    {
      title: 'Correct page',
      language: 'en',
      sharedId: 'correctPage',
    },
    {
      title: 'Correct page',
      language: 'es',
      sharedId: 'correctPage',
    },
    {
      title: 'Correct page',
      language: 'fr',
      sharedId: 'correctPage',
    },
    {
      title: 'Duplicated in non default language',
      language: 'en',
      sharedId: 'nonDefDuplicatePage',
    },
    {
      title: 'Duplicated in non default language',
      language: 'es',
      sharedId: 'nonDefDuplicatePage',
    },
    {
      title: 'Duplicated in non default language',
      language: 'es',
      sharedId: 'nonDefDuplicatePage',
    },
    {
      title: 'Duplicated in non default language',
      language: 'fr',
      sharedId: 'nonDefDuplicatePage',
    },
    {
      title: 'Duplicated in default language',
      language: 'en',
      sharedId: 'defDuplicatePage',
    },
    {
      title: 'Duplicated in default language',
      language: 'en',
      sharedId: 'defDuplicatePage',
    },
    {
      title: 'Duplicated in default language',
      language: 'es',
      sharedId: 'defDuplicatePage',
    },
    {
      title: 'Duplicated in default language',
      language: 'fr',
      sharedId: 'defDuplicatePage',
    },
    {
      title: 'Multiples in all languages',
      language: 'en',
      sharedId: 'allMultiplesPage',
    },
    {
      title: 'Multiples in all languages',
      language: 'en',
      sharedId: 'allMultiplesPage',
    },
    {
      title: 'Multiples in all languages',
      language: 'es',
      sharedId: 'allMultiplesPage',
    },
    {
      title: 'Multiples in all languages',
      language: 'es',
      sharedId: 'allMultiplesPage',
    },
    {
      title: 'Multiples in all languages',
      language: 'es',
      sharedId: 'allMultiplesPage',
    },
    {
      title: 'Multiples in all languages',
      language: 'fr',
      sharedId: 'allMultiplesPage',
    },
    {
      title: 'Multiples in all languages',
      language: 'fr',
      sharedId: 'allMultiplesPage',
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
      sharedId: 'correctEntity',
    },
    {
      title: 'Correct entity',
      template: templateId,
      language: 'es',
      sharedId: 'correctEntity',
    },
    {
      title: 'Duplicated in non default language',
      template: templateId,
      language: 'en',
      sharedId: 'nonDefDuplicateEntity',
    },
    {
      title: 'Duplicated in non default language',
      template: templateId,
      language: 'es',
      sharedId: 'nonDefDuplicateEntity',
    },
    {
      title: 'Duplicated in non default language',
      template: templateId,
      language: 'es',
      sharedId: 'nonDefDuplicateEntity',
    },
    {
      title: 'Duplicated in non default language',
      template: templateId,
      language: 'fr',
      sharedId: 'nonDefDuplicateEntity',
    },
    {
      title: 'Duplicated in default language',
      template: templateId,
      language: 'en',
      sharedId: 'defDuplicateEntity',
    },
    {
      title: 'Duplicated in default language',
      template: templateId,
      language: 'en',
      sharedId: 'defDuplicateEntity',
    },
    {
      title: 'Duplicated in default language',
      template: templateId,
      language: 'es',
      sharedId: 'defDuplicateEntity',
    },
    {
      title: 'Duplicated in default language',
      template: templateId,
      language: 'fr',
      sharedId: 'defDuplicateEntity',
    },
    {
      title: 'Multiples in all languages',
      template: templateId,
      language: 'en',
      sharedId: 'allMultiplesEntity',
    },
    {
      title: 'Multiples in all languages',
      template: templateId,
      language: 'en',
      sharedId: 'allMultiplesEntity',
    },
    {
      title: 'Multiples in all languages',
      template: templateId,
      language: 'es',
      sharedId: 'allMultiplesEntity',
    },
    {
      title: 'Multiples in all languages',
      template: templateId,
      language: 'es',
      sharedId: 'allMultiplesEntity',
    },
    {
      title: 'Multiples in all languages',
      template: templateId,
      language: 'es',
      sharedId: 'allMultiplesEntity',
    },
    {
      title: 'Multiples in all languages',
      template: templateId,
      language: 'fr',
      sharedId: 'allMultiplesEntity',
    },
    {
      title: 'Multiples in all languages',
      template: templateId,
      language: 'fr',
      sharedId: 'allMultiplesEntity',
    },
  ],
};

export { settingsOnlyDuplication, defaultLanguageDuplication, templateId, allCases as fixture };
