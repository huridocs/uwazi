import db, { testingDB, DBFixture } from 'api/utils/testing_db';

export const fixturesSnippetsSearch: DBFixture = {
  settings: [{ languages: [{ key: 'en', default: true }, { key: 'es' }] }],
  entities: [
    {
      _id: testingDB.id(),
      sharedId: 'entity1SharedId',
      title: 'entity that contains the searched term for fulltext search',
      language: 'en',
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
      title: 'public entity that also contains the searched term in title',
      language: 'en',
      published: true,
    },
    {
      _id: testingDB.id(),
      sharedId: 'entity4SharedId',
      title: 'private entity that also contains the searched term only in title',
      language: 'en',
      permissions: [{ level: 'read', refId: 'user1', type: 'user' }],
    },
    {
      _id: testingDB.id(),
      sharedId: 'entity1SharedId',
      title: 'entidad que contiene searched term como contenido',
      language: 'es',
    },
  ],
  files: [
    {
      _id: db.id(),
      entity: 'entity1SharedId',
      filename: 'entity1SharedId.pdf',
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
    {
      _id: db.id(),
      entity: 'entity3SharedId',
      filename: 'entity3SharedId.pdf',
      language: 'eng',
      type: 'document',
      fullText: {
        1: 'Other[[1]] phrase[[1]] which[[1]] contains[[1]] different[[1]] data[[1]].'.repeat(5),
        2: 'Other[[2]] phrase[[2]] which[[2]] contains[[2]] different[[2]] data[[2]].'.repeat(5),
        3: 'Phrase[[3]] which[[3]] contains[[3]] searched[[3]] term[[3]]. '.repeat(5),
      },
    },
    {
      _id: db.id(),
      entity: 'entity4SharedId',
      filename: 'entity4SharedId.pdf',
      language: 'eng',
      type: 'document',
      fullText: {
        1: 'Other[[1]] phrase[[1]] which[[1]] contains[[1]] different[[1]] data[[1]].'.repeat(5),
        2: 'Other[[2]] phrase[[2]] which[[2]] contains[[2]] different[[2]] data[[2]].'.repeat(5),
        3: 'Other[[3]] phrase[[3]] which[[3]] contains[[3]] different[[3]] data[[3]].'.repeat(5),
        4: 'Phrase[[3]] which[[4]] contains[[4]] searched[[4]] term[[4]]. '.repeat(5),
      },
    },
  ],
};
