import db from 'api/utils/testing_db';

const docId1 = db.id().toString();
const docId4 = db.id().toString();

export default {
  entities: [
    {
      _id: docId1,
      title: 'first doc',
      type: 'document',
      file: {
        filename: 'existingPDF.pdf',
      },
    },
    {
      title: 'non document entity',
      type: 'entity',
    },
    {
      title: 'second doc',
      type: 'document',
      file: {
        filename: 'missingPDF.pdf',
      },
    },
    {
      _id: docId4,
      title: 'third doc',
      type: 'document',
      file: {
        filename: 'existingPDF.pdf',
      },
    },
    {
      title: 'missconformed doc entity',
      type: 'document',
    },
  ],
};

export { docId1, docId4 };
