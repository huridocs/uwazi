import testingDB from 'api/utils/testing_db';

const firstConnectionId = testingDB.id();
const secondConnectionId = testingDB.id();
const noPdfInfoConnectionId = testingDB.id();
const documentId = testingDB.id();
const documentWithoutPdfInfoId = testingDB.id();

export default {
  files: [
    {
      _id: documentId,
      filename: 'test.pdf',
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
      _id: documentWithoutPdfInfoId,
      filename: 'test.pdf',
      pdfInfo: null,
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
      file: documentId,
    },
    {
      _id: secondConnectionId,
      range: {
        start: 327,
        end: 349,
        text: 'BUILD A CUSTOM LIBRARY',
      },
      file: documentId,
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
      file: documentId,
    },
    {
      _id: noPdfInfoConnectionId,
      range: {
        start: 104,
        end: 182,
        text: 'Uwazi is an open-source solution for building and sharing document collections',
      },
      file: documentWithoutPdfInfoId,
    },
  ],
};

export { documentId, firstConnectionId, secondConnectionId, noPdfInfoConnectionId };
