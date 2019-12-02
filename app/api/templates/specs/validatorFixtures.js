import db from 'api/utils/testing_db';

const templateId = db.id();

export default {
  templates: [
    {
      _id: templateId,
      name: 'DuplicateName'
    }
  ]
};

export {
  templateId
};
