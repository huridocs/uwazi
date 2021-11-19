import { DBFixture } from 'api/utils/testing_db';
import { getFixturesFactory } from 'api/utils/fixturesFactory';

const factory = getFixturesFactory();

const settings = [
  {
    features: {
      metadataExtraction: {
        url: 'http://localhost:1234/',
        templates: [
          {
            template: factory.id('templateToSegmentA'),
            properties: ['property1', 'property2'],
          },
          {
            template: factory.id('templateToSegmentB'),
            properties: ['property1'],
          },
        ],
      },
      segmentation: {
        url: 'http://localhost:1234/files',
      },
    },
  },
];

const fixturesPdfNameA = 'documentA.pdf';
const fixturesPdfNameB = 'documentB.pdf';

const fixtures: DBFixture = {
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
    factory.file('F1', 'A1', 'document', fixturesPdfNameA, 'en', [
      {
        name: 'property1',
        selection: {
          text: 'something',
          selectionRectangles: [{ top: 0, left: 0, width: 0, height: 0, page: '1' }],
        },
      },
    ]),
    factory.file('F2', 'A2', 'document', fixturesPdfNameB, 'en', [
      {
        name: 'text',
        selection: {
          text: 'property1',
          selectionRectangles: [{ top: 0, left: 0, width: 0, height: 0, page: '1' }],
        },
      },
    ]),
    factory.file('F3', 'A3', 'document', fixturesPdfNameA, 'en', [
      {
        name: 'property2',
        selection: {
          text: 'something',
          selectionRectangles: [{ top: 0, left: 0, width: 0, height: 0, page: '1' }],
        },
      },
    ]),
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
  segmentations: [
    {
      _id: factory.id('S1'),
      filename: fixturesPdfNameA,
      fileID: factory.id('F1'),
      segmentation: {
        page_height: 841,
        page_width: 595,
        paragraphs: [
          {
            left: 58,
            top: 63,
            width: 457,
            height: 15,
            page_number: 1,
            text: 'something something',
          },
        ],
      },
    },
    {
      _id: factory.id('S2'),
      filename: fixturesPdfNameA,
      fileID: factory.id('F2'),
      segmentation: { page_height: 1, page_width: 2, paragraphs: [] },
    },
    {
      _id: factory.id('S3'),
      filename: fixturesPdfNameA,
      fileID: factory.id('F3'),
      segmentation: { page_height: 1, page_width: 2, paragraphs: [] },
    },
    {
      _id: factory.id('S4'),
      filename: fixturesPdfNameA,
      fileID: factory.id('F4'),
      segmentation: { page_height: 1, page_width: 2, paragraphs: [] },
    },
    {
      _id: factory.id('S5'),
      filename: fixturesPdfNameA,
      fileID: factory.id('F5'),
      segmentation: { page_height: 1, page_width: 2, paragraphs: [] },
    },
  ],
};

export { fixtures, factory };
