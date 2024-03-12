import { ObjectId } from 'mongodb';
import { Entity, Fixture, Settings, TranslationDBO } from '../types';

const template1 = new ObjectId();
const template2 = new ObjectId();
const template3 = new ObjectId();

const settings: Settings[] = [
  {
    _id: new ObjectId(),
    languages: [
      {
        _id: new ObjectId(),
        key: 'en',
        label: 'English',
        default: true,
      },
      {
        _id: new ObjectId(),
        key: 'es',
        label: 'Spanish',
      },
    ],
  },
];

const templates = [
  { _id: template1, name: 't1' },
  { _id: template2, name: 't2', default: true },
  { _id: template3, name: 't3' },
];

const t1TemplateContext: TranslationDBO['context'] = {
  type: 'Entity',
  label: 't1',
  id: template1.toString(),
};

const t2TemplateContext: TranslationDBO['context'] = {
  type: 'Entity',
  label: 't2',
  id: template2.toString(),
};

const t3TemplateContext: TranslationDBO['context'] = {
  type: 'Entity',
  label: 't3',
  id: template3.toString(),
};

const translationsV2: TranslationDBO[] = [
  { _id: new ObjectId(), language: 'en', key: 'Title', value: 'Title', context: t1TemplateContext },
  { _id: new ObjectId(), language: 'en', key: 't1', value: 't1', context: t1TemplateContext },
  { _id: new ObjectId(), language: 'en', key: 'Title', value: 'Title', context: t2TemplateContext },
  { _id: new ObjectId(), language: 'en', key: 't2', value: 't2', context: t2TemplateContext },
  { _id: new ObjectId(), language: 'en', key: 'Title', value: 'Title', context: t3TemplateContext },
  { _id: new ObjectId(), language: 'en', key: 't3', value: 't3', context: t3TemplateContext },
  { _id: new ObjectId(), language: 'es', key: 'Title', value: 'Title', context: t1TemplateContext },
  { _id: new ObjectId(), language: 'es', key: 't1', value: 't1', context: t1TemplateContext },
  { _id: new ObjectId(), language: 'es', key: 'Title', value: 'Title', context: t2TemplateContext },
  { _id: new ObjectId(), language: 'es', key: 't2', value: 't2', context: t2TemplateContext },
  { _id: new ObjectId(), language: 'es', key: 'Title', value: 'Title', context: t3TemplateContext },
  { _id: new ObjectId(), language: 'es', key: 't3', value: 't3', context: t3TemplateContext },
];

const entities: Entity[] = [
  { sharedId: 's1', title: 'entity1', template: template1, language: 'en', published: true },
  { sharedId: 's2', title: 'entity2', template: template2, language: 'en', published: true },
  { sharedId: 's3', title: 'entity3', language: 'en', published: true },
  { sharedId: 's4', title: 'entity4', template: template2, language: 'en', published: true },
  { sharedId: 's5', title: 'entity5', template: undefined, language: 'en', published: true },
  { sharedId: 's6', title: 'entity6', template: template3, language: 'en', published: true },
  // @ts-ignore - intentional wrong fixture
  { sharedId: 's7', title: 'entity7', template: null, language: 'en', published: true },
  { sharedId: 's1', title: 'entity1', template: template1, language: 'es', published: true },
  { sharedId: 's2', title: 'entity2', template: template2, language: 'es', published: true },
  { sharedId: 's3', title: 'entity3', language: 'es', published: true },
  { sharedId: 's4', title: 'entity4', template: template2, language: 'es', published: true },
  { sharedId: 's5', title: 'entity5', template: undefined, language: 'es', published: true },
  { sharedId: 's6', title: 'entity6', template: template3, language: 'es', published: true },
  // @ts-ignore - intentional wrong fixture
  { sharedId: 's7', title: 'entity7', template: null, language: 'es', published: true },
];

const fixtures: Fixture = {
  settings,
  entities,
  templates,
  translationsV2,
};

const correctFixture = {
  settings,
  entities: [
    { sharedId: 's1', title: 'entity1', template: template1, language: 'en', published: true },
    { sharedId: 's2', title: 'entity2', template: template2, language: 'en', published: true },
    { sharedId: 's3', title: 'entity6', template: template3, language: 'en', published: true },
    { sharedId: 's1', title: 'entity1', template: template1, language: 'es', published: true },
    { sharedId: 's2', title: 'entity2', template: template2, language: 'es', published: true },
    { sharedId: 's3', title: 'entity6', template: template3, language: 'es', published: true },
  ],
  templates,
  translationsV2,
};

export { fixtures, correctFixture, template1, template2, template3 };
