import db from 'api/utils/testing_db';

const [file1, file2, file3] = [db.id(), db.id(), db.id()];

export default {
  files: [
    {
      _id: file1,
    },
    {
      _id: file2,
    },
    {
      _id: file3,
    },
  ],
  updatelogs: [
    {
      _id: db.id(),
      timestamp: 50,
      namespace: 'files',
      mongoId: file3,
      deleted: false,
    },
  ],
};

export { file1, file2, file3 };
