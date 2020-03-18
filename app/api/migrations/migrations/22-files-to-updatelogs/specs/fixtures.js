import db from 'api/utils/testing_db';

const [file1, file2] = [db.id(), db.id()];

export default {
  files: [
    {
      _id: file1,
    },
    {
      _id: file2,
    },
  ],
};

export { file1, file2 };
