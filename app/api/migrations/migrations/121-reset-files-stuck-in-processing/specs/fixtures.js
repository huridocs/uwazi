import db from 'api/utils/testing_db';

export default {
  files: [
    {
      _id: db.id(),
      originalname: 'regular file (no status)',
    },
    {
      _id: db.id(),
      originalname: 'status ready file',
      status: 'ready',
    },
    {
      _id: db.id(),
      originalname: 'status failed file',
      status: 'failed',
    },
    {
      _id: db.id(),
      originalname: 'status processsing file (no text)',
      status: 'processing',
    },
    {
      _id: db.id(),
      originalname: 'status processsing file (with text)',
      status: 'processing',
      fullText: { 1: 'Some text' },
    },
    {
      _id: db.id(),
      originalname: 'status processsing file (no text 2)',
      status: 'processing',
    },
    {
      _id: db.id(),
      originalname: 'status processsing file (with text 2)',
      status: 'processing',
      fullText: {},
    },
  ],
};
