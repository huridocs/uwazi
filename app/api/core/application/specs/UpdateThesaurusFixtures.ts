import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { DBFixture } from 'api/utils/testing_db';
import { randomUUID } from 'crypto';
import { ObjectId } from 'mongodb';

export const factory = getFixturesFactory();

export const fixtures: DBFixture = {
  settings: [
    {
      languages: [
        { label: 'English', key: 'en', default: true },
        { label: 'Spanish', key: 'es' },
      ],
    },
  ],
  translationsV2: [
    // English translations
    {
      _id: new ObjectId(),
      context: {
        type: 'Thesaurus',
        label: 'Countries',
        id: factory.id('countries').toString(),
      },
      key: 'Countries',
      language: 'en',
      value: 'Countries',
    },
    {
      _id: new ObjectId(),
      context: {
        type: 'Thesaurus',
        label: 'Countries',
        id: factory.id('countries').toString(),
      },
      key: 'USA',
      language: 'en',
      value: 'USA',
    },
    {
      _id: new ObjectId(),
      context: {
        type: 'Thesaurus',
        label: 'Countries',
        id: factory.id('countries').toString(),
      },
      key: 'Canada',
      language: 'en',
      value: 'Canada',
    },
    {
      _id: new ObjectId(),
      context: {
        type: 'Thesaurus',
        label: 'Countries',
        id: factory.id('countries').toString(),
      },
      key: 'Europe',
      language: 'en',
      value: 'Europe',
    },
    {
      _id: new ObjectId(),
      context: {
        type: 'Thesaurus',
        label: 'Countries',
        id: factory.id('countries').toString(),
      },
      key: 'France',
      language: 'en',
      value: 'France',
    },
    {
      _id: new ObjectId(),
      context: {
        type: 'Thesaurus',
        label: 'Countries',
        id: factory.id('countries').toString(),
      },
      key: 'Germany',
      language: 'en',
      value: 'Germany',
    },

    // Spanish translations
    {
      _id: new ObjectId(),
      context: {
        type: 'Thesaurus',
        label: 'Countries',
        id: factory.id('countries').toString(),
      },
      key: 'Countries',
      language: 'es',
      value: 'Countries ES',
    },
    {
      _id: new ObjectId(),
      context: {
        type: 'Thesaurus',
        label: 'Countries',
        id: factory.id('countries').toString(),
      },
      key: 'USA',
      language: 'es',
      value: 'USA ES',
    },
    {
      _id: new ObjectId(),
      context: {
        type: 'Thesaurus',
        label: 'Countries',
        id: factory.id('countries').toString(),
      },
      key: 'Canada',
      language: 'es',
      value: 'Canada ES',
    },
    {
      _id: new ObjectId(),
      context: {
        type: 'Thesaurus',
        label: 'Countries',
        id: factory.id('countries').toString(),
      },
      key: 'Europe',
      language: 'es',
      value: 'Europe ES',
    },
    {
      _id: new ObjectId(),
      context: {
        type: 'Thesaurus',
        label: 'Countries',
        id: factory.id('countries').toString(),
      },
      key: 'France',
      language: 'es',
      value: 'France ES',
    },
    {
      _id: new ObjectId(),
      context: {
        type: 'Thesaurus',
        label: 'Countries',
        id: factory.id('countries').toString(),
      },
      key: 'Germany',
      language: 'es',
      value: 'Germany ES',
    },
  ],
  dictionaries: [
    {
      _id: factory.id('countries'),
      name: 'Countries',
      values: [
        { id: randomUUID(), label: 'USA' },
        { id: randomUUID(), label: 'Canada' },
        {
          id: randomUUID(),
          label: 'Europe',
          values: [
            { id: randomUUID(), label: 'France' },
            { id: randomUUID(), label: 'Germany' },
          ],
        },
      ],
    },
    {
      _id: factory.id('fruits'),
      name: 'Fruits',
      values: [
        { id: randomUUID(), label: 'Apple' },
        { id: randomUUID(), label: 'Banana' },
      ],
    },
  ],
};
