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
          _id: db.id(),
          type: propertyTypes.media,
          label: 'video',
          name: templateUtils.safeName('video'),
        },
        {
          _id: db.id(),
          type: propertyTypes.link,
          label: 'original url',
          name: templateUtils.safeName('original url'),
        },
        {
          _id: db.id(),
          type: propertyTypes.image,
          label: 'screenshot',
          name: templateUtils.safeName('screenshot'),
        },
        {
          _id: db.id(),
          type: propertyTypes.date,
          label: 'time of request',
          name: templateUtils.safeName('time of request'),
        },
        {
          _id: db.id(),
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
