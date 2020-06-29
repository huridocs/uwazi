import db from 'api/utils/testing_db';

const templateId = db.id();
const simpleTemplateId = db.id();
const nonExistentId = db.id();

export default {
  templates: [
    {
      name: 'template',
      _id: templateId,
      properties: [
        { name: 'name', type: 'text' },
        { name: 'markdown', type: 'markdown' },
        { name: 'numeric', type: 'numeric' },
        { name: 'date', type: 'date' },
        { name: 'daterange', type: 'daterange' },
        { name: 'multidate', type: 'multidate' },
        { name: 'multidaterange', type: 'multidaterange' },
        { name: 'select', type: 'select' },
        { name: 'multiselect', type: 'multiselect' },
        { name: 'relationship', type: 'relationship' },
        { name: 'media', type: 'media' },
        { name: 'image', type: 'image' },
        { name: 'link', type: 'link' },
        { name: 'preview', type: 'preview' },
        { name: 'geolocation', type: 'geolocation' },
        { name: 'required_multiselect', type: 'multiselect' },
        { name: 'field_nested', type: 'nested' },
      ],
    },
    {
      _id: simpleTemplateId,
      properties: [{ name: 'markdown', type: 'markdown' }],
    },
  ],
};

export { templateId, simpleTemplateId, nonExistentId };
