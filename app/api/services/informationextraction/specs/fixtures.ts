import { DBFixture } from 'api/utils/testing_db';
import { getFixturesFactory } from 'api/utils/fixturesFactory';

const factory = getFixturesFactory();

const settings = [
  {
    languages: [{ default: true, label: 'English', key: 'en' }],
    features: {
      'metadata-extraction': true,
      metadataExtraction: {
        url: 'http://localhost:1234/',
      },
      segmentation: {
        url: 'http://localhost:1234/files',
      },
    },
  },
];

const fixturesPdfNameA = 'documentA.pdf';
const fixturesPdfNameB = 'documentB.pdf';
const fixturesPdfNameC = 'documentC.pdf';
const fixturesPdfNameD = 'documentD.pdf';
const fixturesPdfNameE = 'documentE.pdf';
const fixturesPdfNameF = 'documentF.pdf';

const fixtures: DBFixture = {
  settings,
  ixextractors: [
    factory.ixExtractor('prop1extractor', 'property1', [
      'templateToSegmentA',
      'templateToSegmentB',
    ]),
    factory.ixExtractor('prop2extractor', 'property2', ['templateToSegmentA']),
    factory.ixExtractor('prop3extractor', 'property3', ['templateToSegmentA']),
    factory.ixExtractor('prop4extractor', 'property4', ['templateToSegmentA']),
    factory.ixExtractor('extractorWithOneFailedSegmentation', 'property15', ['templateToSegmentC']),
  ],
  entities: [
    factory.entity(
      'A1',
      'templateToSegmentA',
      {
        property1: [
          {
            value: 1088985600,
          },
        ],
      },
      { language: 'other' }
    ),
    factory.entity('A1', 'templateToSegmentA', {
      property1: [
        {
          value: 'different from selected text',
        },
      ],
      property2: [
        {
          value: 1299196800,
        },
      ],
    }),
    factory.entity('A2', 'templateToSegmentA'),
    factory.entity('A3', 'templateToSegmentA', { property2: [{ value: 1 }] }),
    factory.entity('A4', 'templateToSegmentA'),
    factory.entity('A5', 'templateToSegmentA', { property1: [{ value: 1 }] }),
    factory.entity('A6', 'templateToSegmentA'),
    factory.entity('A7', 'templateToSegmentA'),
    factory.entity('A8', 'templateToSegmentA'),
    factory.entity('A9', 'templateToSegmentA'),
    factory.entity('A10', 'templateToSegmentA'),
    factory.entity('A11', 'templateToSegmentA'),
    factory.entity('A12', 'templateToSegmentA'),
    factory.entity('A13', 'templateToSegmentA'),
    factory.entity('A14', 'templateToSegmentA'),
    factory.entity('A15', 'templateToSegmentC'),
    factory.entity('A16', 'templateToSegmentC'),
  ],
  files: [
    factory.file('F1', 'A1', 'document', fixturesPdfNameA, 'other', '', [
      {
        name: 'property1',
        selection: {
          text: 'something not in the entity',
          selectionRectangles: [{ top: 0, left: 0, width: 0, height: 0, page: '1' }],
        },
      },
      {
        name: 'property2',
        selection: {
          text: 'Fri Mar 04 2011',
          selectionRectangles: [{ top: 0, left: 0, width: 0, height: 0, page: '1' }],
        },
      },
    ]),
    factory.file('F2', 'A2', 'document', fixturesPdfNameB, 'eng', '', [
      {
        name: 'text',
        selection: {
          text: 'property1',
          selectionRectangles: [{ top: 0, left: 0, width: 0, height: 0, page: '1' }],
        },
      },
    ]),
    factory.file('F3', 'A3', 'document', fixturesPdfNameC, 'eng', '', [
      {
        name: 'property1',
        selection: {
          text: 'something',
          selectionRectangles: [{ top: 0, left: 0, width: 0, height: 0, page: '1' }],
        },
      },
    ]),
    factory.file('F4', 'A1', 'document', fixturesPdfNameD, 'eng', '', [
      {
        name: 'property2',
        selection: {
          text: 'something',
          selectionRectangles: [{ top: 0, left: 0, width: 0, height: 0, page: '1' }],
        },
      },
    ]),
    factory.file('F5', 'A5', 'document', fixturesPdfNameE, 'spa'),
    factory.file('F6', 'A6', 'document', fixturesPdfNameF, 'eng'),
    factory.file('F15', 'A15', 'document', fixturesPdfNameA, 'eng'),
    factory.file('F16', 'A16', 'document', fixturesPdfNameC, 'eng'),
  ],
  segmentations: [
    {
      _id: factory.id('S1'),
      filename: fixturesPdfNameA,
      xmlname: 'documentA.xml',
      fileID: factory.id('F1'),
      status: 'ready',
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
            text: 'something',
          },
        ],
      },
    },
    {
      _id: factory.id('S2'),
      filename: fixturesPdfNameB,
      xmlname: 'documentB.xml',
      fileID: factory.id('F2'),
      status: 'ready',
      segmentation: { page_height: 1, page_width: 2, paragraphs: [] },
    },
    {
      _id: factory.id('S3'),
      filename: fixturesPdfNameC,
      xmlname: 'documentC.xml',
      fileID: factory.id('F3'),
      status: 'ready',
      segmentation: { page_height: 1, page_width: 2, paragraphs: [] },
    },
    {
      _id: factory.id('S4'),
      filename: fixturesPdfNameD,
      xmlname: 'documentD.xml',
      fileID: factory.id('F4'),
      status: 'ready',
      segmentation: { page_height: 1, page_width: 2, paragraphs: [] },
    },
    {
      _id: factory.id('S5'),
      filename: fixturesPdfNameE,
      xmlname: 'documentE.xml',
      fileID: factory.id('F5'),
      status: 'ready',
      segmentation: { page_height: 1, page_width: 2, paragraphs: [] },
    },
    {
      _id: factory.id('S6'),
      filename: fixturesPdfNameF,
      xmlname: 'documentF.xml',
      fileID: factory.id('F6'),
      status: 'processing',
    },
  ],
  ixsuggestions: [
    {
      fileId: factory.id('F1'),
      entityId: 'A1',
      entityTemplate: factory.id('templateToSegmentA').toString(),
      language: 'en',
      propertyName: 'property1',
      extractorId: factory.id('prop1extractor'),
      suggestedValue: 'suggestion_text_1',
      segment: 'segment_text_1',
      status: 'ready',
      page: 1,
      date: 100,
    },
    {
      fileId: factory.id('F3'),
      entityId: 'A3',
      entityTemplate: factory.id('templateToSegmentA').toString(),
      language: 'en',
      propertyName: 'property1',
      extractorId: factory.id('prop1extractor'),
      suggestedValue: 'suggestion_text_3',
      segment: 'segment_text_3',
      status: 'ready',
      page: 1,
      date: 100,
    },
    {
      fileId: factory.id('F4'),
      entityId: 'A1',
      entityTemplate: factory.id('templateToSegmentA').toString(),
      language: 'en',
      extractorId: factory.id('prop2extractor'),
      propertyName: 'property2',
      suggestedValue: 'suggestion_text_1',
      segment: 'segment_text_1',
      status: 'processing',
      page: 1,
      date: 100,
    },
    {
      fileId: factory.id('F4'),
      entityId: 'A1',
      entityTemplate: factory.id('templateToSegmentA').toString(),
      language: 'en',
      extractorId: factory.id('prop2extractor'),
      propertyName: 'property2',
      suggestedValue: 'suggestion_text_1',
      segment: 'segment_text_1',
      status: 'ready',
      page: 1,
      date: 100,
    },
    {
      fileId: factory.id('F4'),
      entityId: 'A1',
      entityTemplate: factory.id('templateToSegmentA').toString(),
      language: 'en',
      extractorId: factory.id('prop2extractor'),
      propertyName: 'property2',
      suggestedValue: 'suggestion_text_property2_1',
      segment: 'segment_text_property2_1',
      status: 'ready',
      page: 1,
      date: 220,
    },
    {
      fileId: factory.id('F4'),
      entityId: 'A1',
      entityTemplate: factory.id('templateToSegmentA').toString(),
      language: 'en',
      extractorId: factory.id('prop2extractor'),
      propertyName: 'property2',
      suggestedValue: 'suggestion_text_property2_2',
      segment: 'segment_text_property2_2',
      status: 'ready',
      page: 1,
      date: 190,
    },
    {
      fileId: factory.id('F4'),
      entityId: 'A1',
      entityTemplate: factory.id('templateToSegmentA').toString(),
      language: 'en',
      extractorId: factory.id('prop2extractor'),
      propertyName: 'property2',
      suggestedValue: 'suggestion_text_property2_3',
      segment: 'segment_text_property2_3',
      status: 'ready',
      page: 1,
      date: 220,
    },
    {
      fileId: factory.id('F15'),
      entityId: 'A15',
      entityTemplate: factory.id('templateToSegmentC').toString(),
      language: 'en',
      extractorId: factory.id('extractorWithOneFailedSegmentation'),
      propertyName: 'property15',
      suggestedValue: '',
      segment: '',
      status: 'ready',
      state: 'Obsolete',
      date: 100,
    },
    {
      fileId: factory.id('F16'),
      entityId: 'A16',
      entityTemplate: factory.id('templateToSegmentC').toString(),
      language: 'en',
      extractorId: factory.id('extractorWithOneFailedSegmentation'),
      propertyName: 'property15',
      suggestedValue: '',
      segment: '',
      status: 'ready',
      state: 'Error',
      date: 100,
    },
  ],
  ixmodels: [
    {
      extractorId: factory.id('prop1extractor'),
      creationDate: 200,
      status: 'ready',
      findingSuggestions: true,
    },
    {
      extractorId: factory.id('prop4extractor'),
      creationDate: 200,
      status: 'ready',
      findingSuggestions: true,
    },
    {
      extractorId: factory.id('extractorWithOneFailedSegmentation'),
      creationDate: 200,
      status: 'ready',
      findingSuggestions: true,
    },
    {
      extractorId: factory.id('prop2extractor'),
      creationDate: 200,
      status: 'ready',
      findingSuggestions: true,
    },
    {
      extractorId: factory.id('prop3extractor'),
      creationDate: 200,
      status: 'processing',
      findingSuggestions: true,
    },
  ],
  templates: [
    factory.template('templateToSegmentA', [
      factory.property('property1', 'text'),
      factory.property('property2', 'date'),
      factory.property('property3', 'numeric'),
      factory.property('property4', 'markdown'),
    ]),
    factory.template('templateToSegmentB', [factory.property('property1', 'text')]),
    factory.template('templateToSegmentC', [factory.property('property15', 'text')]),
  ],
};

export { fixtures, factory };
