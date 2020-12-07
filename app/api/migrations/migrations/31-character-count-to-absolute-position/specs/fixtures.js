import testingDB from 'api/utils/testing_db';

const connectionId = testingDB.id();
const documentId = testingDB.id();

export default {
  files: [
    {
      _id: documentId,
      filename: 'first_document.pdf',
      pdfInfo: {
        1: {
          chars: 1813,
        },
        2: {
          chars: 5329,
        },
        3: {
          chars: 8911,
        },
        4: {
          chars: 13428,
        },
        5: {
          chars: 17878,
        },
        6: {
          chars: 22296,
        },
        7: {
          chars: 25112,
        },
        8: {
          chars: 25537,
        },
      },
    },
  ],
  connections: [
    {
      _id: connectionId,
      range: {
        start: 1214,
        end: 1269,
        text: 'SOLICITUD DE INTERPRETACIÓNY PROCEDIMIENTO ANTELA CORTE',
      },
      file: documentId,
    },
  ],
};

export { documentId, connectionId };
