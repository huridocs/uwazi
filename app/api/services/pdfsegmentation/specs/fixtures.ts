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
  files: [
    factory.file('F1', {
      filename: fixturesPdfNameA,
      entity: 'A1',
      type: 'document',
      status: 'ready',
    }),
  ],
};

const fixturesOtherFile: DBFixture = {
  entities: [factory.entity('A2', 'templateToSegmentB')],
  settings: otherSettings,
  files: [
    factory.file('F2', {
      filename: fixturesPdfNameB,
      entity: 'A2',
      type: 'document',
      status: 'ready',
    }),
  ],
};

const fixturesMissingPdf: DBFixture = {
  entities: [factory.entity('A1', 'templateToSegmentA')],
  settings,
  files: [
    factory.file('F1', {
      filename: 'missing.pdf',
      entity: 'A1',
      type: 'document',
      status: 'ready',
    }),
  ],
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
    factory.file('F1', {
      filename: fixturesPdfNameA,
      entity: 'A1',
      type: 'document',
      status: 'ready',
    }),
    factory.file('F2', {
      filename: fixturesPdfNameA,
      entity: 'A2',
      type: 'document',
      status: 'ready',
    }),
    factory.file('F3', {
      filename: fixturesPdfNameA,
      entity: 'A3',
      type: 'document',
      status: 'ready',
    }),
    factory.file('F4', {
      filename: fixturesPdfNameA,
      entity: 'A4',
      type: 'document',
      status: 'ready',
    }),
    factory.file('F5', {
      filename: fixturesPdfNameA,
      entity: 'A5',
      type: 'document',
      status: 'ready',
    }),
    factory.file('F6', {
      filename: fixturesPdfNameA,
      entity: 'A5',
      type: 'document',
      status: 'failed',
    }),
  ],
};

const fixturesOneHundredFiles: DBFixture = {
  settings,
  entities: [...Array(100).keys()].map(x =>
    factory.entity(`A${x.toString()}`, 'templateToSegmentA')
  ),
  files: [...Array(100).keys()].map(x =>
    factory.file(`F${x.toString()}`, {
      filename: fixturesPdfNameA,
      entity: `A${x.toString()}`,
      type: 'document',
      status: 'ready',
    })
  ),
};

const fixturesWithFailedSegmentations: DBFixture = {
  settings,
  entities: [
    factory.entity('A1', 'templateToSegmentA'),
    factory.entity('A2', 'templateToSegmentA'),
    factory.entity('A3', 'templateToSegmentA'),
    factory.entity('A4', 'templateToSegmentA'),
  ],
  files: [
    factory.file('F1', {
      filename: 'document1.pdf',
      entity: 'A1',
      type: 'document',
      status: 'ready',
    }),
    factory.file('F2', {
      filename: 'document2.pdf',
      entity: 'A2',
      type: 'document',
      status: 'ready',
    }),
    factory.file('F3', {
      filename: 'document3.pdf',
      entity: 'A3',
      type: 'document',
      status: 'ready',
    }),
    factory.file('F4', {
      filename: 'document4.pdf',
      entity: 'A4',
      type: 'document',
      status: 'ready',
    }),
  ],
};

export {
  fixturesPdfNameA,
  fixturesPdfNameB,
  fixturesOneFile,
  fixturesOtherFile,
  fixturesOneHundredFiles,
  fixturesFiveFiles,
  fixturesMissingPdf,
  fixturesWithFailedSegmentations,
};
