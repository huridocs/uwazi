/* eslint-disable */
import db from 'api/utils/testing_db';
const templateToBeEditedId = db.id();
const templateToBeDeleted = '589af97080fc0b23471d67f1';
const templateWithContents = db.id();
export default {
  templates: [
    {_id: templateToBeEditedId, name: 'template to be edited', default: true},
    {_id: db.id(templateToBeDeleted), name: 'to be deleted'},
    {_id: db.id(), name: 'duplicated name'},
    {_id: db.id(), name: 'thesauri template', properties: [{type: 'select', content: 'thesauri1', label: 'select'}]},
    {_id: db.id(), name: 'thesauri template 2', properties: [{type: 'select', content: 'thesauri1', label: 'select2'}]},
    {_id: templateWithContents, name: 'content template', properties: [{id: '1', type: 'select', content: 'thesauri1', label: 'select3'}, {id: '2', type: 'multiselect', content: 'thesauri2', label: 'select4'}]}
  ]
};

export {
  templateToBeEditedId,
  templateToBeDeleted,
  templateWithContents
};
