import { ClientTemplateSchema } from 'V2/shared/types';

const template1: ClientTemplateSchema = {
  properties: [],
  commonProperties: [
    {
      _id: '1.1',
      label: 'Template 1 title',
      name: 'title',
      type: 'text',
    },
    {
      _id: '1.2',
      label: 'Date added',
      name: 'creationDate',
      type: 'date',
    },
  ],
  name: 'Template1',
  default: true,
  _id: '1',
};

const template2: ClientTemplateSchema = {
  properties: [],
  commonProperties: [
    {
      _id: '2.1',
      label: 'template 2 title',
      name: 'title',
      type: 'text',
      generatedId: true,
    },
    {
      _id: '2.2',
      label: 'Date added',
      name: 'creationDate',
      type: 'date',
    },
  ],
  name: 'Template2',
  _id: '2',
};

const template3: ClientTemplateSchema = {
  properties: [],
  commonProperties: [
    {
      _id: '3.1',
      label: 'Template 3 title',
      name: 'title',
      type: 'text',
      generatedId: true,
    },
    {
      _id: '3.2',
      label: 'Date added',
      name: 'creationDate',
      type: 'date',
    },
  ],
  name: 'Template1',
  default: true,
  _id: '1',
};

export { template1, template2, template3 };
