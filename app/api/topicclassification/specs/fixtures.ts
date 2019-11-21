/** @format */

import db from 'api/utils/testing_db';
import { propertyTypes } from 'shared/propertyTypes';
import { TemplateSchema } from 'api/templates/templateType';

export const template1 = db.id();

export default {
  templates: <TemplateSchema[]>[
    {
      _id: template1,
      name: 'template1',
      commonProperties: [{ name: 'title', label: 'Title', type: propertyTypes.text }],
      default: true,
      properties: [
        { name: 'date', label: 'Date', type: propertyTypes.date },
        { name: 'text', label: 'Recommendation', type: propertyTypes.markdown },
      ],
    },
  ],
  settings: [
    {
      _id: db.id(),
      site_name: 'Uwazi',
      languages: [{ key: 'en', label: 'English', default: true }],
    },
  ],
};
