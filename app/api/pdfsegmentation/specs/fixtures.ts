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

const fixturesTwelveFiles: DBFixture = {
  settings,
  entities: [
    factory.entity('A1', 'templateToSegmentA'),
    factory.entity('A2', 'templateToSegmentA'),
    factory.entity('A3', 'templateToSegmentA'),
    factory.entity('A4', 'templateToSegmentA'),
    factory.entity('A5', 'templateToSegmentA'),
    factory.entity('A6', 'templateToSegmentA'),
    factory.entity('A7', 'templateToSegmentA'),
    factory.entity('A8', 'templateToSegmentA'),
    factory.entity('A9', 'templateToSegmentA'),
    factory.entity('A10', 'templateToSegmentA'),
    factory.entity('A11', 'templateToSegmentA'),
    factory.entity('A12', 'templateToSegmentA'),
    factory.entity('A13', 'templateToSegmentA'),
    factory.entity('A14', 'templateToSegmentA'),
  ],
  files: [
    factory.file('F1', 'A1', 'en', 'document', fixturesPdfName),
    factory.file('F2', 'A2', 'en', 'document', fixturesPdfName),
    factory.file('F3', 'A3', 'en', 'document', fixturesPdfName),
    factory.file('F4', 'A4', 'en', 'document', fixturesPdfName),
    factory.file('F5', 'A5', 'en', 'document', fixturesPdfName),
    factory.file('F6', 'A6', 'en', 'document', fixturesPdfName),
    factory.file('F7', 'A7', 'en', 'document', fixturesPdfName),
    factory.file('F8', 'A8', 'en', 'document', fixturesPdfName),
    factory.file('F9', 'A9', 'en', 'document', fixturesPdfName),
    factory.file('F10', 'A10', 'en', 'document', fixturesPdfName),
    factory.file('F11', 'A11', 'en', 'document', fixturesPdfName),
    factory.file('F12', 'A12', 'en', 'document', fixturesPdfName),
  ],
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

export { fixturesPdfName, fixturesOneFile, fixturesTwelveFiles, fixturesUseDefaultPdfPerLanguage };
