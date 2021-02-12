import testingDB from 'api/utils/testing_db';

const firstConnectionId = testingDB.id();
const secondConnectionId = testingDB.id();
const documentId = testingDB.id();
const documentWithVoidTocId = testingDB.id();
const missingDocumentId = testingDB.id();
const connectionToMissingDocumentId = testingDB.id();
const connectionOutOfRangeId = testingDB.id();

export default {
  files: [
    {
      _id: documentId,
      filename: 'migration33.pdf',
      type: 'document',
      pdfInfo: {
        1: {
          chars: 207,
        },
        2: {
          chars: 327,
        },
        3: {
          chars: 476,
        },
        4: {
          chars: 582,
        },
      },
      toc: [
        {
          range: {
            start: 207,
            end: 227,
          },
          label: 'PUBLISH WITH PURPOSE',
          indentation: 0,
        },
        {
          range: {
            start: 327,
            end: 349,
          },
          label: 'BUILD A CUSTOM LIBRARY',
          indentation: 1,
        },
        {
          range: {
            start: 476,
            end: 500,
          },
          label: 'DISCOVER NEW INFORMATION',
          indentation: 2,
        },
      ],
    },
    {
      _id: 'document without toc id',
      filename: 'migration33.pdf',
      type: 'document',
      pdfInfo: {
        1: {
          chars: 207,
        },
        2: {
          chars: 327,
        },
        3: {
          chars: 476,
        },
        4: {
          chars: 582,
        },
      },
    },
    {
      _id: documentWithVoidTocId,
      filename: 'migration33.pdf',
      type: 'document',
      pdfInfo: {
        1: {
          chars: 207,
        },
        2: {
          chars: 327,
        },
        3: {
          chars: 476,
        },
        4: {
          chars: 582,
        },
      },
      toc: [],
    },
    {
      _id: missingDocumentId,
      filename: 'missingDocument.pdf',
      type: 'document',
      pdfInfo: {
        1: {
          chars: 207,
        },
        2: {
          chars: 327,
        },
        3: {
          chars: 476,
        },
        4: {
          chars: 582,
        },
      },
      toc: [],
    },
    {
      _id: 'no pdf Info',
      filename: 'nopdfinfo.pdf',
      type: 'document',
      toc: [
        {
          range: {
            start: 1,
            end: 2,
          },
          label: 'nopdfinfo',
          indentation: 0,
        },
      ],
    },
    {
      _id: 'all 0 pdf Info',
      filename: 'all0pdfinfo.pdf',
      type: 'document',
      toc: [
        {
          range: {
            start: 1,
            end: 2,
          },
          label: 'nopdfinfo',
          indentation: 0,
        },
      ],
      pdfInfo: {
        1: {
          chars: 0,
        },
        2: {
          chars: 0,
        },
        3: {
          chars: 0,
        },
        4: {
          chars: 0,
        },
      },
    },
    {
      _id: 'outofrangetoc',
      filename: 'migration33.pdf',
      type: 'document',
      entity: 'entity1',
      pdfInfo: {
        1: {
          chars: 207,
        },
        2: {
          chars: 327,
        },
        3: {
          chars: 476,
        },
        4: {
          chars: 582,
        },
      },
      toc: [
        {
          range: {
            start: 99999,
            end: 99999,
          },
          label: 'WRONG',
          indentation: 0,
        },
      ],
    },
  ],
  connections: [
    {
      _id: firstConnectionId,
      range: {
        start: 104,
        end: 182,
        text: 'Uwazi is an open-source solution for building and sharing document collections',
      },
      file: documentId.toString(),
    },
    {
      _id: secondConnectionId,
      range: {
        start: 327,
        end: 349,
        text: 'BUILD A CUSTOM LIBRARY',
      },
      file: documentId.toString(),
    },
    {
      _id: 'no file',
      range: {
        start: 1214,
        end: 1269,
        text: '',
      },
    },
    {
      _id: 'no range',
      file: documentId.toString(),
    },
    {
      _id: connectionToMissingDocumentId,
      range: {
        start: 104,
        end: 182,
        text: 'Uwazi is an open-source solution for building and sharing document collections',
      },
      file: missingDocumentId.toString(),
    },
    {
      _id: connectionOutOfRangeId,
      range: {
        start: 9999999,
        end: 9999999,
        text: 'no text match',
      },
      file: documentId.toString(),
    },
  ],
};

export {
  documentId,
  firstConnectionId,
  secondConnectionId,
  documentWithVoidTocId,
  missingDocumentId,
  connectionToMissingDocumentId,
  connectionOutOfRangeId,
};
