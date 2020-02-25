/** @format */

import db from 'api/utils/testing_db';

const templateId = db.id();
const relatedTo = db.id();
const templateToBeInherited = db.id();
const propertyToBeInherited = db.id();

export default {
  templates: [
    {
      _id: templateId,
      name: 'DuplicateName',
      properties: [],
    },
    {
      _id: templateToBeInherited,
      name: 'template to be inherited',
      commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
      properties: [{ _id: propertyToBeInherited, name: 'inherit_me', type: 'text' }],
      default: true,
    },
    {
      name: 'template inheriting from another',
      commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
      properties: [
        {
          id: '1',
          type: 'relationship',
          name: 'inherit',
          label: 'Inherit',
          relationtype: relatedTo,
          content: templateToBeInherited,
          inherit: true,
          inheritProperty: propertyToBeInherited,
        },
      ],
    },
  ],
  relationtypes: [{ _id: relatedTo, name: 'related to' }],
};

export { templateId, templateToBeInherited, propertyToBeInherited };
