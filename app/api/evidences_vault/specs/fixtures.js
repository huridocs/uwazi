/* eslint-disable max-len */
import db from 'api/utils/testing_db';
import { templateTypes } from 'shared/templateTypes';
import { templateUtils } from 'api/templates';

const templateId = db.id();

export default {
  templates: [
    {
      _id: templateId,
      name: 'template',
      properties: [
        {
          type: templateTypes.media,
          label: 'video',
          name: templateUtils.safeName('video'),
        },
        {
          type: templateTypes.link,
          label: 'original url',
          name: templateUtils.safeName('original url'),
        },
        {
          type: templateTypes.image,
          label: 'screenshot',
          name: templateUtils.safeName('screenshot'),
        },
        {
          type: templateTypes.date,
          label: 'time of request',
          name: templateUtils.safeName('time of request'),
        },
        {
          type: templateTypes.markdown,
          label: 'data',
          name: templateUtils.safeName('data'),
        },
      ]
    },
  ],
  settings: [
    {
      _id: db.id(),
      site_name: 'Uwazi',
      languages: [
        { key: 'en', label: 'English', default: true },
      ]
    }
  ]
};

export {
  templateId
};
