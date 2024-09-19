import db, { DBFixture } from 'api/utils/testing_db';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { Settings } from 'shared/types/settingsType';

const factory = getFixturesFactory();

const settings: Settings[] = [
  {
    features: {
      segmentation: {
        url: 'http://localhost:1234/files',
      },
    },
  },
];

const otherSettings = [
  {
    _id: db.id(),
    features: {
      segmentation: {
        url: 'http://localhost:1234/files',
      },
    },
  },
];

const fixturesPdfNameA = 'documentA.pdf';
const fixturesPdfNameB = 'documentB.pdf';

const fixturesOneFile: DBFixture = {
  entities: [factory.entity('A1', 'templateToSegmentA')],
  settings,
  files: [factory.fileDeprecated('F1', 'A1', 'document', fixturesPdfNameA)],
};

const fixturesOtherFile: DBFixture = {
  entities: [factory.entity('A2', 'templateToSegmentB')],
  settings: otherSettings,
  files: [factory.fileDeprecated('F2', 'A2', 'document', fixturesPdfNameB)],
};

const fixturesMissingPdf: DBFixture = {
  entities: [factory.entity('A1', 'templateToSegmentA')],
  settings,
  files: [factory.fileDeprecated('F1', 'A1', 'document', 'missing.pdf')],
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
    factory.fileDeprecated('F1', 'A1', 'document', fixturesPdfNameA),
    factory.fileDeprecated('F2', 'A2', 'document', fixturesPdfNameA),
    factory.fileDeprecated('F3', 'A3', 'document', fixturesPdfNameA),
    factory.fileDeprecated('F4', 'A4', 'document', fixturesPdfNameA),
    factory.fileDeprecated('F5', 'A5', 'document', fixturesPdfNameA),
  ],
};

const fixturesOneHundredFiles: DBFixture = {
  settings,
  entities: [...Array(100).keys()].map(x =>
    factory.entity(`A${x.toString()}`, 'templateToSegmentA')
  ),
  files: [...Array(100).keys()].map(x =>
    factory.fileDeprecated(`F${x.toString()}`, `A${x.toString()}`, 'document', fixturesPdfNameA)
  ),
};

export {
  fixturesPdfNameA,
  fixturesPdfNameB,
  fixturesOneFile,
  fixturesOtherFile,
  fixturesOneHundredFiles,
  fixturesFiveFiles,
  fixturesMissingPdf,
};
