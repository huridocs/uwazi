import { DBFixture } from 'api/utils/testing_db';
import { getFixturesFactory } from 'api/utils/fixturesFactory';

const factory = getFixturesFactory();

const fixturesPdfNameA = 'documentA.pdf';
const fixturesPdfNameB = 'documentB.pdf';
const fixturesPdfNameC = 'documentC.pdf';
const fixturesPdfNameD = 'documentD.pdf';
const fixturesPdfNameE = 'documentE.pdf';
const fixturesPdfNameF = 'documentF.pdf';
const fixturesPdfNameG = 'documentG.pdf';
const fixturesPdfNameH = 'documentH.pdf';
const fixturesPdfNameI = 'documentI.pdf';
const ficturesPdfNameJ = 'documentJ.pdf';

const fixtures: DBFixture = {
  settings: [
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
  ],
  ixextractors: [
    factory.ixExtractor('prop1extractor', 'property1', [
      'templateToSegmentA',
      'templateToSegmentB',
    ]),
    factory.ixExtractor('prop2extractor', 'property2', ['templateToSegmentA']),
    factory.ixExtractor('prop3extractor', 'property3', ['templateToSegmentA']),
    factory.ixExtractor('prop4extractor', 'property4', ['templateToSegmentA']),
    factory.ixExtractor('extractorWithOneFailedSegmentation', 'property15', ['templateToSegmentC']),
    factory.ixExtractor('extractorWithMultiselect', 'property_multiselect', ['templateToSegmentD']),
    factory.ixExtractor('extractorWithMultiselectWithoutTrainingData', 'property_multiselect', [
      'templateToSegmentE',
    ]),
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
    factory.entity('A17', 'templateToSegmentD', {
      property_multiselect: [{ value: 'A', label: 'A' }],
    }),
    factory.entity('A18', 'templateToSegmentD', {
      property_multiselect: [
        { value: 'B', label: 'B' },
        { value: 'C', label: 'C' },
      ],
    }),
    factory.entity('A19', 'templateToSegmentD', {
      property_multiselect: [],
    }),
    factory.entity('A20', 'templateToSegmentE', {
      property_multiselect: [],
    }),
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
    factory.file('F17', 'A17', 'document', fixturesPdfNameG, 'eng'),
    factory.file('F18', 'A18', 'document', fixturesPdfNameH, 'eng'),
    factory.file('F19', 'A19', 'document', fixturesPdfNameI, 'eng'),
    factory.file('F20', 'A20', 'document', ficturesPdfNameJ, 'eng'),
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
    {
      _id: factory.id('S7'),
      filename: fixturesPdfNameG,
      xmlname: 'documentG.xml',
      fileID: factory.id('F17'),
      status: 'ready',
      segmentation: {
        page_height: 13,
        page_width: 13,
        paragraphs: [
          {
            left: 1,
            top: 1,
            width: 1,
            height: 1,
            page_number: 1,
            text: 'A',
          },
        ],
      },
    },
    {
      _id: factory.id('S8'),
      filename: fixturesPdfNameH,
      xmlname: 'documentH.xml',
      fileID: factory.id('F18'),
      status: 'ready',
      segmentation: {
        page_height: 13,
        page_width: 13,
        paragraphs: [
          {
            left: 1,
            top: 1,
            width: 1,
            height: 1,
            page_number: 1,
            text: 'B',
          },
          {
            left: 1,
            top: 1,
            width: 1,
            height: 1,
            page_number: 1,
            text: 'C',
          },
        ],
      },
    },
    {
      _id: factory.id('S9'),
      filename: fixturesPdfNameI,
      xmlname: 'documentI.xml',
      fileID: factory.id('F19'),
      status: 'ready',
      segmentation: {
        page_height: 13,
        page_width: 13,
        paragraphs: [],
      },
    },
    {
      _id: factory.id('S10'),
      filename: ficturesPdfNameJ,
      xmlname: 'documentJ.xml',
      fileID: factory.id('F20'),
      status: 'ready',
      segmentation: {
        page_height: 13,
        page_width: 13,
        paragraphs: [],
      },
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
      state: {
        labeled: false,
        withValue: false,
        withSuggestion: false,
        match: false,
        hasContext: false,
        obsolete: true,
        processing: false,
        error: false,
      },
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
      state: {
        labeled: false,
        withValue: false,
        withSuggestion: false,
        match: false,
        hasContext: false,
        obsolete: true,
        processing: false,
        error: true,
      },
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
    {
      extractorId: factory.id('extractorWithMultiselect'),
      creationDate: 200,
      status: 'ready',
      findingSuggestions: false,
    },
    {
      extractorId: factory.id('extractorWithMultiselectWithoutTrainingData'),
      creationDate: 200,
      status: 'ready',
      findingSuggestions: false,
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
    factory.template('templateToSegmentD', [
      factory.property('property_multiselect', 'multiselect', {
        content: factory.id('thesauri1').toString(),
      }),
    ]),
    factory.template('templateToSegmentE', [
      factory.property('property_multiselect', 'multiselect', {
        content: factory.id('thesauri1').toString(),
      }),
    ]),
  ],
  dictionaries: [factory.thesauri('thesauri1', ['A', 'B', 'C'])],
};

export { fixtures, factory };
