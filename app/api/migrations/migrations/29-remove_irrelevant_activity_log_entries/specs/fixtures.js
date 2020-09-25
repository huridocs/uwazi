import { testingDB } from 'api/utils/testing_db';

export default {
  activitylogs: [
    {
      _id: testingDB.id(),
      url: '/api/templates',
      method: 'POST',
    },
    {
      _id: testingDB.id(),
      url: '/api/templates',
      method: 'HEAD',
    },
    {
      _id: testingDB.id(),
      url: '/api/templates',
      method: 'DELETE',
    },
    {
      _id: testingDB.id(),
      url: '/api/templates',
      method: 'OPTIONS',
    },
    {
      _id: testingDB.id(),
      url: '/api/users',
      method: 'POST',
    },
    {
      _id: testingDB.id(),
      url: '/api/login',
      method: 'POST',
    },
    {
      _id: testingDB.id(),
      url: '/api/contact',
      method: 'POST',
    },
    {
      _id: testingDB.id(),
      url: '/api/unlockaccount',
      method: 'POST',
    },
    {
      _id: testingDB.id(),
      url: '/api/resetpassword',
      method: 'POST',
    },
    {
      _id: testingDB.id(),
      url: '/api/recoverpassword',
      method: 'POST',
    },
    {
      _id: testingDB.id(),
      url: '/api/documents/pdfInfo',
      method: 'POST',
    },
  ],
};
