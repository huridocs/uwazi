import db from 'api/utils/testing_db';

const firstTemplate = db.id();

export default {
  activitylogs: [
    { method: 'POST', url: '/api/entities', query: '{}', body: '{"_id":"123","title":"Hello"}', time: 1560770143000, username: 'admin' }
  ],

  templates: [
    { _id: firstTemplate, name: 'Existing Template' }
  ]
};

export {
  firstTemplate,
};
