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
      permissions: [{ level: 'read', refId: 'user1', type: 'user' }],
    },
    {
      _id: testingDB.id(),
      sharedId: 'entity1SharedId',
      title: 'entidad que contiene searched term como contenido',
      language: 'es',
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
        1: 'Other[[1]] phrase[[1]] which[[1]] contains[[1]] different[[1]] data[[1]].'.repeat(5),
        2: 'Phrase[[2]] which[[2]] contains[[2]] searched[[2]] term[[2]]. '.repeat(5),
        3: 'Other[[3]] phrase[[3]] which[[3]] contains[[3]] different[[3]] data[[3]].'.repeat(5),
        4: 'Phrase[[4]] which[[4]] contains[[4]] searched[[4]] term[[4]]. '.repeat(5),
      },
      pdfInfo: {
        1: { chars: 10 },
        2: { chars: 20 },
      },
    },
  ],
};
