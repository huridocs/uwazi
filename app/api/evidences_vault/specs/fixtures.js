/* eslint-disable max-len */
import db from 'api/utils/testing_db';
import { propertyTypes } from 'shared/propertyTypes';
import { templateUtils } from 'api/templates';

const templateId = db.id();

export default {
  templates: [
    {
      _id: templateId,
      name: 'template',
      properties: [
        {
          type: propertyTypes.media,
          label: 'video',
          name: templateUtils.safeName('video'),
        },
        {
          type: propertyTypes.link,
          label: 'original url',
          name: templateUtils.safeName('original url'),
        },
        {
          type: propertyTypes.image,
          label: 'screenshot',
          name: templateUtils.safeName('screenshot'),
        },
        {
          type: propertyTypes.date,
          label: 'time of request',
          name: templateUtils.safeName('time of request'),
        },
        {
          type: propertyTypes.markdown,
          label: 'data',
          name: templateUtils.safeName('data'),
        },
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

export { templateId };
