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
    {
      _id: testingDB.id(),
      url: '/api/files/upload/document',
      body: '{}',
      method: 'POST',
    },
    {
      _id: testingDB.id(),
      url: '/api/files/upload/document',
      body: "{ entityId: 'entity1' }",
      method: 'POST',
    },
    {
      _id: testingDB.id(),
      url: '/api/documents',
      body: "{ entityId: 'entity1' }",
      method: 'POST',
    },
    {
      _id: testingDB.id(),
      url: '/api/attachments/delete',
      body: "{ entityId: 'entity1' }",
      method: 'DELETE',
    },
    {
      _id: testingDB.id(),
      url: '/api/attachments/upload',
      body: "{ entityId: 'entity1' }",
      method: 'POST',
    },
  ],
  updatelogs: [
    {
      _id: testingDB.id(),
      namespace: 'translations',
      deleted: false,
      timestamp: 1602860773348.0,
    },
    {
      _id: testingDB.id(),
      namespace: 'activitylog',
      deleted: false,
      timestamp: 1602721307223.0,
    },
    {
      _id: testingDB.id(),
      namespace: 'templates',
      deleted: true,
      timestamp: 1602861088016.0,
    },
    {
      _id: testingDB.id(),
      namespace: 'activitylog',
      deleted: false,
      timestamp: 1602721534695.0,
    },
    {
      _id: testingDB.id(),
      namespace: 'activitylog',
      deleted: false,
      timestamp: 1602723020970.0,
    },
  ],
};
