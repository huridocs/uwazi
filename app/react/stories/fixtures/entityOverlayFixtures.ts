import type { Entity } from '#V2/api/entities/types.js';
import type { ClientTemplateSchema } from '#V2/shared/types.js';
import { templates as baseTemplates } from './referencesFixtures.js';

const overlayTargetSharedId = 'a2pe98qmqb';

const overlayTemplates: ClientTemplateSchema[] = baseTemplates.map(template => {
  if (template._id !== 'template2') {
    return template;
  }
  return {
    ...template,
    properties: [
      { _id: '2.4', type: 'date', label: 'Date of birth', name: 'dob' },
      { _id: '2.5', type: 'select', label: 'Gender', name: 'gender' },
    ],
  };
});

const overlayTargetEntity: Entity = {
  _id: '6a0c5e0584b3eaec97612df6',
  sharedId: overlayTargetSharedId,
  language: 'en',
  template: 'template2',
  title: 'Person 1',
  creationDate: 1779195397083,
  editDate: 1779195397083,
  user: 'user1',
  icon: { _id: '', type: 'Empty', label: '' },
  metadata: {
    dob: [{ value: 1777593600 }],
    gender: [{ value: 'f7c5ffa9', label: 'Male' }],
  },
  published: true,
  documents: [],
  attachments: [],
};

export { overlayTargetSharedId, overlayTemplates, overlayTargetEntity };
