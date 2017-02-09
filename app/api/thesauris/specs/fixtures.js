//export default {
  //"docs":[
    //{"_id":"c08ef2532f0bd008ac5174b45e033c93", "type":"thesauri","name":"secret recipes", "values":[{"id":"1", "label": "Secret pizza recipe"}, {"id":"2", "label": "secret pasta recipe"}]},
    //{"_id":"c08ef2532f0bd008ac5174b45e033c94", "type":"thesauri","name":"Top 2 scify books", "values": [{"id":"1", "label": "Enders game"},{"id":"2", "label": "Fundation"}]},
    //{"_id":"templateID", "type":"template","name":"Judge", "properties": [], isEntity: true},
    //{"_id":"entityID", "sharedId": "sharedId", "language": 'es', "type":"entity","title":"Dredd", "metadata": [], template: "templateID", icon: "Icon"}
  //]
//};

import {db} from 'api/utils';
const entityTemplateId = '589af97080fc0b23471d67f3';
const dictionaryId = '589af97080fc0b23471d67f4';
export default {
  dictionaries: [
    {_id: db.id(), name: 'dictionary'},
    {_id: db.id(dictionaryId), name: 'dictionary 2', values: [{label: 'value 1'}, {label: 'value 2'}]}
  ],
  templates: [
    {_id: db.id(entityTemplateId), name: 'entityTemplate', isEntity: true}
  ],
  entities: [
    {_id: db.id(), sharedId: 'sharedId', title: 'english entity', language: 'en', template: db.id(entityTemplateId), icon: 'Icon'},
    {_id: db.id(), sharedId: 'sharedId', title: 'spanish entity', language: 'es', template: db.id(entityTemplateId), icon: 'Icon'}
  ]
};

export {
  dictionaryId
};
