import { testingDB, DBFixture } from 'api/utils/testing_db';

const entity1en = testingDB.id();
const entity2en = testingDB.id();
const entity3en = testingDB.id();
const entity4en = testingDB.id();
const entity5en = testingDB.id();

const entity1es = testingDB.id();
const entity2es = testingDB.id();
const entity3es = testingDB.id();
const entity4es = testingDB.id();
const entity5es = testingDB.id();

export const fixturesTitleSearch: DBFixture = {
  settings: [
    {
      languages: [
        { key: 'en', label: 'EN', default: true },
        { key: 'es', label: 'ES' },
      ],
    },
  ],
  entities: [
    {
      _id: entity1en,
      sharedId: 'entity1SharedId',
      title: 'title to search one',
      language: 'en',
      template: 'template1',
    },
    {
      _id: entity2en,
      sharedId: 'entity2SharedId',
      title: 'title does not match',
      language: 'en',
      template: 'template1',
    },
    {
      _id: entity3en,
      sharedId: 'entity3SharedId',
      title: 'title to search 2',
      language: 'en',
      template: 'template1',
    },
    {
      _id: entity4en,
      sharedId: 'entity4SharedId',
      title: 'entity with short fullText',
      language: 'en',
      template: 'template1',
    },
    {
      _id: entity5en,
      sharedId: 'entity5SharedId',
      title: 'entity with short fullText 2',
      language: 'en',
      template: 'template1',
    },
    {
      _id: entity1es,
      sharedId: 'entity1SharedId',
      title: 'titulo to search one',
      language: 'es',
      template: 'template1',
    },
    {
      _id: entity2es,
      sharedId: 'entity2SharedId',
      title: 'title does not match',
      language: 'es',
      template: 'template1',
    },
    {
      _id: entity3es,
      sharedId: 'entity3SharedId',
      title: 'title without busqueda',
      language: 'es',
    },
    {
      _id: entity4es,
      sharedId: 'entity4SharedId',
      title: 'entidad con texto completo corto',
      language: 'es',
      template: 'template1',
    },
    {
      _id: entity5es,
      sharedId: 'entity5SharedId',
      title: 'entidad con texto completo corto 2',
      language: 'es',
      template: 'template1',
    },
  ],
  files: [
    {
      _id: testingDB.id(),
      entity: 'entity4SharedId',
      filename: 'entity4SharedId.pdf',
      language: 'eng',
      type: 'document',
      fullText: {
        1: 'Some[[1]] short[[1]] text[[1]] with[[1]] unique[[1]] terms[[1]].',
      },
    },
    {
      _id: testingDB.id(),
      entity: 'entity5SharedId',
      filename: 'entity5SharedId.pdf',
      language: 'eng',
      type: 'document',
      fullText: {
        1: 'Some[[1]] short[[1]] text[[1]] with[[1]] exquisite[[1]] terms[[1]].',
      },
    },
  ],
};

export {
  entity1en,
  entity2en,
  entity3en,
  entity4en,
  entity5en,
  entity1es,
  entity2es,
  entity3es,
  entity4es,
  entity5es,
};
