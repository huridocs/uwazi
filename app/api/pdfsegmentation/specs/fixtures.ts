import db, { DBFixture } from 'api/utils/testing_db';
import { getFixturesFactory } from 'api/utils/fixturesFactory';

const factory = getFixturesFactory();

const settings = [
  {
    _id: db.id(),
    languages: [{ key: 'en', default: true }, { key: 'es' }, { key: 'pt' }],
    features: {
      'metadata-extraction': [
        {
          id: factory.id('templateToSegmentA'),
          properties: ['property1', 'property2'],
        },
        {
          id: factory.id('templateToSegmentB'),
          properties: ['property1'],
        },
      ],
    },
  },
];

const fixturesPdfName = 'f2082bf51b6ef839690485d7153e847a.pdf';

const fixturesOneFile: DBFixture = {
  settings,
  entities: [factory.entity('A1', 'templateToSegmentA')],
  files: [factory.file('F1', 'A1', 'en', 'document', fixturesPdfName)],
};

const fixturesUseDefaultPdfPerLanguage: DBFixture = {
  settings,
  entities: [
    factory.entity('A1', 'templateToSegmentA', {}, { language: 'es' }),
    factory.entity('B1', 'templateToSegmentB', {}, { language: 'pt' }),
    factory.entity('B2', 'templateNotSegmentC', {}, { language: 'en' }),
  ],
  files: [
    factory.file('F1', 'A1', 'en', 'document', 'test.pdf'),
    factory.file('F2', 'B1', 'es', 'attachment', 'a.png'),
    factory.file('F3', 'B2', 'pt', 'document', 'c.pdf'),
  ],
};

export { fixturesPdfName, fixturesOneFile, fixturesUseDefaultPdfPerLanguage };
