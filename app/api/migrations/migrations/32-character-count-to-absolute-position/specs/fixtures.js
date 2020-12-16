import testingDB from 'api/utils/testing_db';

const firstConnectionId = testingDB.id();
const secondConnectionId = testingDB.id();
const noPdfInfoConnectionId = testingDB.id();
const documentId = testingDB.id();
const documentWithoutPdfInfoId = testingDB.id();
const documentWithVoidTocId = testingDB.id();

export default {
  files: [
    {
      _id: documentId,
      filename: 'migration32.pdf',
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
      filename: 'migration32.pdf',
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
      filename: 'migration32.pdf',
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
      _id: documentWithoutPdfInfoId,
      filename: 'migration32.pdf',
      type: 'document',
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
      _id: noPdfInfoConnectionId,
      range: {
        start: 104,
        end: 182,
        text: 'Uwazi is an open-source solution for building and sharing document collections',
      },
      file: documentWithoutPdfInfoId.toString(),
    },
  ],
};

export {
  documentId,
  firstConnectionId,
  secondConnectionId,
  noPdfInfoConnectionId,
  documentWithVoidTocId,
  documentWithoutPdfInfoId,
};
