import db, { testingDB, DBFixture } from 'api/utils/testing_db';

export const fixturesSnippetsSearch: DBFixture = {
  settings: [{ languages: [{ key: 'en', default: true }, { key: 'es' }] }],
  entities: [
    {
      _id: testingDB.id(),
      sharedId: 'entity1SharedId',
      title: 'entity that contains the searched term for fulltext search',
      language: 'en',
      metadata: {
        property1: [{ value: 'this property has the searched term as content' }],
        property2: [{ value: 'another value' }],
      },
    },
    {
      _id: testingDB.id(),
      sharedId: 'entity2SharedId',
      title: 'does not match fulltext search',
      language: 'en',
      fullText: {
        1: 'simple[[1]] content[[1]]',
      },
    },
    {
      _id: testingDB.id(),
      sharedId: 'entity3SharedId',
      title: 'public entity that also contains the searched term only in metadata',
      language: 'en',
      published: true,
      metadata: {
        property1: [{ value: 'whatever value' }],
        property2: [{ value: 'searched term as content' }],
      },
    },
    {
      _id: testingDB.id(),
      sharedId: 'entity4SharedId',
      title: 'private entity that also contains the searched term only in metadata',
      language: 'en',
      fullText: {
        1: 'other[[2]] phrase[[2]]',
        2: 'phrase[[1]] which[[1]] contains [[1]] searched[[1]] term[[1]]',
      },
      permissions: [{ level: 'read', refId: 'user1', type: 'user' }],
    },
    {
      _id: testingDB.id(),
      sharedId: 'entity1SharedId',
      title: 'entidad que contiene searched term como contenido',
      language: 'es',
      fullText: {
        1: 'phrase[[1]] which[[1]] contains [[1]] searched[[1]] term[[1]]',
        2: 'other[[2]] phrase[[2]]',
        3: 'final[[3]] text[[3]]',
      },
      metadata: {
        property1: [{ value: 'this property has the searched term as content' }],
        property2: [{ value: 'another value' }],
      },
    },
  ],
  files: [
    {
      _id: db.id(),
      entity: 'entity1SharedId',
      filename: '8202c463d6158af8065022d9b5014cc1.pdf',
      language: 'eng',
      type: 'document',
      fullText: {
        1: 'Phrase[[1]] which[[1]] contains[[1]] searched[[1]] term[[1]]. ',
        2: 'Other[[2]] phrase[[2]]. ',
        3: 'Final[[3]] text[[3]]. ',
      },
      pdfInfo: {
        1: { chars: 10 },
        2: { chars: 20 },
      },
    },
  ],
};
