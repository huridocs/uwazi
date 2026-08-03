import type { Template } from '#shared/contracts/Template.js';

const templates: Template[] = [
  {
    _id: 'template1',
    name: 'Document',
    default: true,
    color: '#C03B22',
    properties: [],
    commonProperties: [],
  },
  {
    _id: 'template2',
    name: 'Case',
    color: '#1565C0',
    properties: [],
    commonProperties: [],
  },
  {
    _id: 'template3',
    name: 'Person',
    color: '#2E7D32',
    synced: true,
    properties: [],
    commonProperties: [],
  },
];

const templateEntityCounts = {
  template1: 0,
  template2: 0,
  template3: 5,
};

export { templates, templateEntityCounts };
