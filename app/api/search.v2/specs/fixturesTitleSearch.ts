import { testingDB, DBFixture } from 'api/utils/testing_db';

const entity1en = testingDB.id();
const entity2en = testingDB.id();
const entity3en = testingDB.id();

const entity1es = testingDB.id();
const entity2es = testingDB.id();
const entity3es = testingDB.id();

export const fixturesTitleSearch: DBFixture = {
  settings: [{ languages: [{ key: 'en', default: true }, { key: 'es' }] }],
  entities: [
    {
      _id: entity1en,
      sharedId: 'entity1SharedId',
      title: 'title to search',
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
      _id: entity1es,
      sharedId: 'entity1SharedId',
      title: 'titulo to search',
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
  ],
};

export { entity1en, entity2en, entity3en, entity1es, entity2es, entity3es };
