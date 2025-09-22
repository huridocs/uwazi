import db from '../utils/testing_db.js';

export default {
  uploads: [
    { _id: db.id(), filename: 'file1.txt' },
    { _id: db.id(), filename: 'file2.txt' },
    { _id: db.id(), filename: 'file3.txt' },
  ],
};
