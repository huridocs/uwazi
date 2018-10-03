import db from 'api/utils/testing_db';

const docId1 = db.id().toString();
const docId2 = db.id().toString();
const docId3 = db.id().toString();
const docId4 = db.id().toString();

export default {
  entities: [{
    _id: docId1,
    title: 'first doc',
    type: 'document',
    file: {
      filename: 'existingPDF.pdf',
    }
  }, {
    _id: docId2,
    title: 'non document entity',
    type: 'entity',
  }, {
    _id: docId3,
    title: 'second doc',
    type: 'document',
    file: {
      filename: 'missingPDF.pdf',
    }
  }, {
    _id: docId4,
    title: 'third doc',
    type: 'document',
    file: {
      filename: 'existingPDF.pdf',
    }
  }]
};

export {
  docId1,
  docId2,
  docId3,
  docId4,
};
