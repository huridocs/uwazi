import { ObjectId } from 'mongodb';

import { DBFixture } from '#api/utils/testing_db.js';

const templateId = new ObjectId();

const orphanedDataFixture: DBFixture = {
  settings: [
    {
      languages: [
        { key: 'en', label: 'English', default: true },
        { key: 'es', label: 'Spanish' },
      ],
    },
  ],
  templates: [{ _id: templateId, name: 'template' }],
  entities: [
    // installed languages — must be kept
    { title: 'Entity EN', language: 'en', sharedId: 'entity1', template: templateId },
    { title: 'Entity ES', language: 'es', sharedId: 'entity1', template: templateId },
    // orphaned language (zh not installed) — must be removed
    { title: 'Entity ZH', language: 'zh', sharedId: 'entity1', template: templateId },
    { title: 'Orphan only ZH', language: 'zh', sharedId: 'entity2', template: templateId },
  ],
};

const noLanguagesFixture: DBFixture = {
  settings: [{ languages: [] }],
  entities: [
    { title: 'Entity EN', language: 'en', sharedId: 'entity1' },
    { title: 'Entity ZH', language: 'zh', sharedId: 'entity2' },
  ],
};

export { orphanedDataFixture, noLanguagesFixture, templateId };
