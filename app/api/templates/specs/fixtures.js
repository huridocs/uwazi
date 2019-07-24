/* eslint-disable */
import db from 'api/utils/testing_db';
const templateToBeEditedId = db.id();
const templateToBeDeleted = '589af97080fc0b23471d67f1';
const templateWithContents = db.id();
const swapTemplate = db.id();
export default {
  templates: [
    {_id: templateToBeEditedId, name: 'template to be edited', commonProperties: [{name: 'title', label: 'Title'}], default: true},
    {_id: db.id(templateToBeDeleted), name: 'to be deleted', commonProperties: [{name: 'title', label: 'Title'}]},
    {_id: db.id(), name: 'duplicated name', commonProperties: [{name: 'title', label: 'Title'}]},
    {
      _id: db.id(),
      name: 'thesauri template',
      properties: [{type: 'select', content: 'thesauri1', label: 'select'}],
      commonProperties: [{name: 'title', label: 'Title'}]
    },
    {
      _id: db.id(),
      name: 'thesauri template 2',
      properties: [{type: 'select', content: 'thesauri1', label: 'select2'}],
      commonProperties: [{name: 'title', label: 'Title'}]
    },
    {
      _id: templateWithContents,
      name: 'content template',
      commonProperties: [{name: 'title', label: 'Title'}],
      properties: [{id: '1', type: 'select', content: 'thesauri1', label: 'select3'}, {id: '2', type: 'multiselect', content: 'thesauri2', label: 'select4'}]
    },
    {
      _id: swapTemplate, name: 'swap names template',
      commonProperties: [{name: 'title', label: 'Title'}],
      properties: [
        {id: '1', type: 'text', name: 'text', label: 'Text'},
        {id: '2', type: 'select', name: 'select', label: 'Select'}
      ]
    },
  ]
};

export {
  templateToBeEditedId,
  templateToBeDeleted,
  templateWithContents,
  swapTemplate
};
