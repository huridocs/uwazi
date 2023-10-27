import db, { testingDB, DBFixture } from 'api/utils/testing_db';
import { FileType } from 'shared/types/fileType';

const entity1enId = testingDB.id();
const entity2enId = testingDB.id();
const template1Id = testingDB.id();
const thesaurusId = testingDB.id();

const fileWithFullText = (sharedId: string, fullText: {}): FileType => ({
  _id: db.id(),
  entity: sharedId,
  filename: `${sharedId}.pdf`,
  language: 'eng',
  type: 'document',
  fullText,
});

const fixturesSnippetsSearch: DBFixture = {
  settings: [
    {
      languages: [
        { key: 'en', label: 'EN', default: true },
        { key: 'es', label: 'ES' },
      ],
    },
  ],
  templates: [
    {
      _id: template1Id,
      properties: [
        { name: 'text_field', type: 'text' },
        { name: 'markdown_field', type: 'markdown' },
        { name: 'thesaurus_property', type: 'select', content: thesaurusId.toString() },
        { name: 'numeric_property', type: 'numeric' },
      ],
    },
  ],
  dictionaries: [
    {
      _id: thesaurusId,
      name: 'Countries',
      values: [
        { _id: db.id(), id: 'country_one', label: 'Republic of Gabriel' },
        { _id: db.id(), id: 'country_two', label: 'Country Two' },
        { _id: db.id(), id: 'country_three', label: 'Republic of Rafa' },
        { _id: db.id(), id: 'country_four', label: 'Country Four' },
      ],
    },
  ],
  entities: [
    {
      _id: entity1enId,
      sharedId: 'entity1SharedId',
      title: 'entity with a document',
      language: 'en',
      template: template1Id,
      metadata: {
        text_field: [{ value: "A short string that we know it's going to come with a snippet" }],
        markdown_field: [{ value: 'Another short string' }],
        thesaurus_property: [{ value: 'country_two' }],
        numeric_property: [{ value: 6 }],
      },
    },
    {
      _id: entity2enId,
      template: template1Id,
      sharedId: 'entity2SharedId',
      title: 'does not match fulltext search',
      language: 'en',
      metadata: {
        thesaurus_property: [{ value: 'country_three' }],
      },
    },
    {
      _id: testingDB.id(),
      sharedId: 'entity3SharedId',
      title: 'private entity valid for fullText search',
      language: 'en',
      permissions: [{ level: 'read', refId: 'user1', type: 'user' }],
    },
    {
      _id: testingDB.id(),
      sharedId: 'entity1SharedId',
      title: 'entidad con un documento',
      language: 'es',
    },
    {
      _id: testingDB.id(),
      sharedId: 'entity4SharedId',
      title: 'entity:with a document',
      language: 'en',
      template: template1Id,
      metadata: {
        text_field: [{ value: 'Tests are not short' }],
      },
    },
  ],
  files: [
    {
      ...fileWithFullText('entity1SharedId', {
        1: 'Other[[1]] phrase[[1]] which[[1]] contains[[1]] different[[1]] data[[1]].'.repeat(5),
        2: 'Phrase[[2]] which[[2]] contains[[2]] searched[[2]] term[[2]]. '.repeat(5),
        3: 'Other[[3]] phrase[[3]] which[[3]] contains[[3]] different[[3]] data[[3]].'.repeat(5),
        4: 'Phrase[[4]] which[[4]] contains[[4]] searched[[4]] term[[4]]. '.repeat(5),
      }),
    },
    {
      ...fileWithFullText('entity3SharedId', {
        1: 'Other[[1]] phrase[[1]] which[[1]] contains[[1]] different[[1]] data[[1]].'.repeat(5),
        2: 'Other[[2]] phrase[[2]] which[[2]] contains[[2]] different[[2]] data[[2]].'.repeat(5),
        3: 'Other[[3]] phrase[[3]] which[[3]] contains[[3]] different[[3]] data[[3]].'.repeat(5),
        4: 'Phrase[[3]] which[[4]] contains[[4]] searched[[4]] term[[4]]. '.repeat(5),
      }),
    },
    {
      _id: db.id(),
      entity: 'entity4SharedId',
      filename: 'entity4SharedId.pdf',
      language: 'eng',
      type: 'document',
      fullText: {
        1: 'Other[[1]] phrase[[1]] which[[1]] contains[[1]] different[[1]] data[[1]].'.repeat(5),
        2: 'Phrase[[2]] which[[2]] contains[[2]] searched:term[[2]]. '.repeat(5),
        3: 'Other[[3]] phrase[[3]] which[[3]] contains[[3]] different[[3]] data[[3]].'.repeat(5),
      },
    },
  ],
};

export { fixturesSnippetsSearch, entity1enId, entity2enId };
