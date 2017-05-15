import db from 'api/utils/testing_db';
const templateToBeEditedId = '589af97080fc0b23471d67f2';
const templateToBeDeleted = '589af97080fc0b23471d67f1';
const templateWithContents = db.id();
export default {
  templates: [
    {_id: db.id(templateToBeEditedId), name: 'template to be edited'},
    {_id: db.id(templateToBeDeleted), name: 'to be deleted'},
    {_id: db.id(), name: 'duplicated name'},
    {_id: db.id(), name: 'thesauri template', properties: [{type: 'select', content: 'thesauri1'}]},
    {_id: db.id(), name: 'thesauri template 2', properties: [{type: 'select', content: 'thesauri1'}]},
    {_id: templateWithContents, name: 'content template', properties: [{id: '1', type: 'select', content: 'thesauri1'}, {id: '2', type: 'multiselect', content: 'thesauri2'}]}
  ]
};

export {
  templateToBeEditedId,
  templateToBeDeleted,
  templateWithContents
};
