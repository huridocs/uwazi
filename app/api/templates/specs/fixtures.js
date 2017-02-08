//export default {
  //"docs":[
    //{"_id":"c08ef2532f0bd008ac5174b45e033c93", "type":"template","name":"template_test", "properties": [{type: "select", "content": "thesauri1"}]},
    //{"_id":"c08ef2532f0bd008ac5174b45e033c94", "type":"template","name":"template_test2"},
    //{"_id":"c08ef2532f0bd008ac5174b45e033c95", "type":"thesauri","name":"thesauri"},
    //{"_id":"c08ef2532f0bd008ac5174b45e033c96", "type":"entity","title":"entity1"},
    //{"_id":"c08ef2532f0bd008ac5174b45e033c97", "type":"entity","title":"entity2"},
    //// metadata property name changes
    //{"_id":"d0298a48d1221c5ceb53c48793015080", "type":"document","title":"doc1", "template": 'template1', "metadata": {"property1": 'value1', "property2": 'value2', "property3": 'value3'}},
    //{"_id":"d0298a48d1221c5ceb53c48793015081", "type":"document","title":"doc2", "template": 'template1', "metadata": {"property1": 'value1', "property2": 'value2', "property3": 'value3'}},
    //{"_id":"d0298a48d1221c5ceb53c48793015082", "type":"document","title":"doc3", "template": 'template2', "metadata": {"property1": 'value1', "property2": 'value2', "property3": 'value3'}},
  //]
//}
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
