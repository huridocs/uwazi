import db, { DBFixture } from 'api/utils/testing_db';
import { getFixturesFactory } from 'api/utils/fixturesFactory';

const factory = getFixturesFactory();

const settings = [
  {
    features: {
      metadataExtraction: [
        {
          template: factory.id('templateToSegmentA'),
          properties: ['property1', 'property2'],
        },
        {
          template: factory.id('templateToSegmentB'),
          properties: ['property1'],
        },
      ],
      segmentation: {
        dataUrl: 'http://localhost:1234/data',
        filesUrl: 'http://localhost:1234/files',
        resultsUrl: 'http://localhost:1234/results',
      },
    },
  },
];

const otherSettings = [
  {
    _id: db.id(),
    features: {
      metadataExtraction: [
        {
          template: factory.id('templateToSegmentB'),
          properties: ['property1'],
        },
      ],
      segmentation: {
        dataUrl: 'http://other-localhost:1234/data',
        filesUrl: 'http://other-localhost:1234/files',
        resultsUrl: 'http://other-localhost:1234/results',
      },
    },
  },
];

const fixturesPdfNameA = 'f2082bf51b6ef839690485d7153e847a.pdf';

const fixturesOneFile: DBFixture = {
  entities: [factory.entity('A1', 'templateToSegmentA')],
  settings,
  files: [factory.file('F1', 'A1', 'document', fixturesPdfNameA)],
};

const fixturesOtherFile: DBFixture = {
  entities: [factory.entity('A1', 'templateToSegmentB')],
  settings: otherSettings,
  files: [factory.file('F1', 'A1', 'document', fixturesPdfNameA)],
};

const fixturesFiveFiles: DBFixture = {
  settings,
  entities: [
    factory.entity('A1', 'templateToSegmentA'),
    factory.entity('A2', 'templateToSegmentA'),
    factory.entity('A3', 'templateToSegmentA'),
    factory.entity('A4', 'templateToSegmentA'),
    factory.entity('A5', 'templateToSegmentA'),
  ],
  files: [
    factory.file('F1', 'A1', 'document', fixturesPdfNameA),
    factory.file('F2', 'A2', 'document', fixturesPdfNameA),
    factory.file('F3', 'A3', 'document', fixturesPdfNameA),
    factory.file('F4', 'A4', 'document', fixturesPdfNameA),
    factory.file('F5', 'A5', 'document', fixturesPdfNameA),
  ],
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
    factory.file('F1', 'A1', 'document', fixturesPdfNameA),
    factory.file('F2', 'A2', 'document', fixturesPdfNameA),
    factory.file('F3', 'A3', 'document', fixturesPdfNameA),
    factory.file('F4', 'A4', 'document', fixturesPdfNameA),
    factory.file('F5', 'A5', 'document', fixturesPdfNameA),
    factory.file('F6', 'A6', 'document', fixturesPdfNameA),
    factory.file('F7', 'A7', 'document', fixturesPdfNameA),
    factory.file('F8', 'A8', 'document', fixturesPdfNameA),
    factory.file('F9', 'A9', 'document', fixturesPdfNameA),
    factory.file('F10', 'A10', 'document', fixturesPdfNameA),
    factory.file('F11', 'A11', 'document', fixturesPdfNameA),
    factory.file('F12', 'A12', 'document', fixturesPdfNameA),
  ],
};

const fixturesFilesWithtMixedInformationExtraction: DBFixture = {
  settings,
  entities: [
    factory.entity('A1', 'templateToSegmentA', {}),
    factory.entity('B1', 'templateToSegmentB', {}),
    factory.entity('B2', 'templateNotSegmentC', {}),
    factory.entity('B3', 'templateNotSegmentC', {}),
  ],
  files: [
    factory.file('F1', 'A1', 'document', fixturesPdfNameA),
    factory.file('F2', 'B1', 'document', fixturesPdfNameA),
    factory.file('F3', 'B2', 'document', fixturesPdfNameA),
    factory.file('F4', 'B3', 'document', fixturesPdfNameA),
  ],
};

const fixturesMultiTenant: DBFixture = {};

export {
  fixturesPdfNameA,
  fixturesOneFile,
  fixturesOtherFile,
  fixturesTwelveFiles,
  fixturesFilesWithtMixedInformationExtraction,
  fixturesFiveFiles,
};
