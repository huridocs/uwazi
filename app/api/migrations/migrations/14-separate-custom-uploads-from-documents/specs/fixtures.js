import db from 'api/utils/testing_db';

export default {
  uploads: [
    { _id: db.id(), filename: 'file1.txt' },
    { _id: db.id(), filename: 'file2.txt' },
    { _id: db.id(), filename: 'file3.txt' },
  ],
};
