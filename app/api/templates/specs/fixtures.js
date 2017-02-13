import {db} from 'api/utils';
const templateToBeEditedId = '589af97080fc0b23471d67f2';
const templateToBeDeleted = '589af97080fc0b23471d67f1';
export default {
  templates: [
    {_id: db.id(templateToBeEditedId), name: 'template to be edited'},
    {_id: db.id(templateToBeDeleted), name: 'to be deleted'},
    {_id: db.id(), name: 'duplicated name'},
    {_id: db.id(), name: 'thesauri template', properties: [{type: 'select', content: 'thesauri1'}]},
    {_id: db.id(), name: 'thesauri template 2', properties: [{type: 'select', content: 'thesauri1'}]}
  ]
};

export {
  templateToBeEditedId,
  templateToBeDeleted
};
