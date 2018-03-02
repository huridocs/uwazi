/* eslint-disable max-len */
import db from 'api/utils/testing_db';

const batmanFinishesId = db.id();
const syncPropertiesEntityId = db.id();
const templateId = db.id();
const templateChangingNames = db.id();
const referenceId = db.id();
const templateWithEntityAsThesauri = db.id();
const templateWithEntityAsThesauri2 = db.id();
const templateWithOnlySelect = db.id();
const templateWithOnlyMultiselect = db.id();

const hub1 = db.id();
const hub2 = db.id();
const hub3 = db.id();
const hub4 = db.id();
const hub5 = db.id();

export default {
  entities: [
    {_id: batmanFinishesId, sharedId: 'shared', type: 'entity', template: templateId, language: 'en', title: 'Batman finishes', published: true, metadata: {property1: 'value1'}, file: {filename: '8202c463d6158af8065022d9b5014cc1.pdf'}},
    {_id: db.id(), sharedId: 'shared', type: 'entity', language: 'es', title: 'Penguin almost done', creationDate: 1, published: true, file: {filename: '8202c463d6158af8065022d9b5014ccb.pdf'}},
    {_id: db.id(), sharedId: 'shared', type: 'entity', language: 'pt', title: 'Penguin almost done', creationDate: 1, published: true, metadata: {text: 'test'}, file: {filename: '8202c463d6158af8065022d9b5014cc1.pdf'}},
    //select/multiselect/date sync
    {_id: syncPropertiesEntityId, template: templateId, sharedId: 'shared1', type: 'entity', language: 'en', title: 'EN', published: true, metadata: {property1: 'text'}, file: {filename: 'nonexistent.pdf'}},
    {_id: db.id(), template: templateId, sharedId: 'shared1', type: 'entity', language: 'es', title: 'ES', creationDate: 1, published: true, metadata: {property1: 'text'}, file: {filename: 'nonexistent.pdf'}},
    {_id: db.id(), template: templateId, sharedId: 'shared1', type: 'entity', language: 'pt', title: 'PT', creationDate: 1, published: true, metadata: {property1: 'text'}, file: {filename: 'nonexistent.pdf'}},
    //docs to change metadata property names
    {_id: db.id(), template: templateChangingNames, sharedId: 'shared10', type: 'entity', language: 'pt', title: 'PT', creationDate: 1, published: true, metadata: {property1: 'value1', property2: 'value2', property3: 'value3'}, file: {filename: '123.pdf'}},
    {_id: db.id(), template: templateChangingNames, sharedId: 'shared10', type: 'entity', language: 'pt', title: 'PT', creationDate: 1, published: true, metadata: {property1: 'value1', property2: 'value2', property3: 'value3'}, file: {filename: '123.pdf'}},
    //docs using entity as thesauri
    {_id: db.id(), template: templateWithEntityAsThesauri, sharedId: 'multiselect', type: 'entity', language: 'en', metadata: {multiselect: ['shared', 'value1']}, file: {filename: '123.pdf'}},
    {_id: db.id(), template: templateWithEntityAsThesauri2, sharedId: 'multiselect', type: 'entity', language: 'es', metadata: {multiselect2: ['shared', 'value2']}, file: {filename: '123.pdf'}},
    {_id: db.id(), template: templateWithEntityAsThesauri, sharedId: 'select', type: 'entity', language: 'en', metadata: {select: 'shared'}, file: {filename: '123.pdf'}},
    {_id: db.id(), template: templateWithEntityAsThesauri2, sharedId: 'select', type: 'entity', language: 'es', metadata: {select2: 'shared'}, file: {filename: '123.pdf'}},
    {_id: db.id(), template: db.id(), sharedId: 'otherTemplateWithMultiselect', type: 'entity', language: 'es', metadata: {select2: 'value'}, file: {filename: '123.pdf'}},
    {_id: db.id(), template: templateWithOnlySelect, sharedId: 'otherTemplateWithSelect', type: 'entity', language: 'es', metadata: {select: 'shared10'}, file: {filename: '123.pdf'}},
    {_id: db.id(), template: templateWithOnlyMultiselect, sharedId: 'otherTemplateWithMultiselect', type: 'entity', language: 'es', metadata: {multiselect: ['value1', 'multiselect']}, file: {filename: '123.pdf'}}
  ],
  settings: [
    {_id: db.id(), languages: [{key: 'es'}, {key: 'pt'}, {key: 'en'}]}
  ],
  templates: [
    {_id: templateId, name: 'template_test', properties: [
      {type: 'text', name: 'text'},
      {type: 'select', name: 'select'},
      {type: 'multiselect', name: 'multiselect'},
      {type: 'date', name: 'date'},
      {type: 'multidate', name: 'multidate'},
      {type: 'multidaterange', name: 'multidaterange'},
      {type: 'daterange', name: 'daterange'},
      {type: 'relationship', name: 'friends', relationType: 'relation1'}
    ]},
    {_id: templateWithOnlyMultiselect, name: 'templateWithOnlyMultiSelectSelect', properties: [
      {type: 'multiselect', name: 'multiselect', content: templateWithEntityAsThesauri.toString()}
    ]},
    {_id: templateWithOnlySelect, name: 'templateWithOnlySelect', properties: [
      {type: 'select', name: 'select', content: templateChangingNames.toString()}
    ]},
    {_id: templateWithEntityAsThesauri, name: 'template_with_thesauri_as_template', properties: [
      {type: 'select', name: 'select', content: templateId.toString()},
      {type: 'multiselect', name: 'multiselect', content: templateId.toString()}
    ]},
    {_id: templateWithEntityAsThesauri2, name: 'template_with_thesauri_as_template', properties: [
      {type: 'select', name: 'select2', content: templateId.toString()},
      {type: 'multiselect', name: 'multiselect2', content: templateId.toString()}
    ]},
    {_id: templateChangingNames, name: 'template_changing_names', properties: [
      {id: '1', type: 'text', name: 'property1'},
      {id: '2', type: 'text', name: 'property2'},
      {id: '3', type: 'text', name: 'property3'}
    ]}
  ],
  connections: [
    {_id: referenceId, entity: 'shared', template: null, hub: hub1, language: 'en'},
    {entity: 'shared2', template: 'relation1', hub: hub1, language: 'en'},
    {entity: 'shared', template: null, hub: hub2, language: 'en'},
    {entity: 'source2', template: 'relation2', hub: hub2, language: 'en'},
    {entity: 'another', template: 'relation3', hub: hub3, language: 'en'},
    {entity: 'document', template: 'relation3', hub: hub3, language: 'en'},
    {entity: 'shared', template: 'relation2', hub: hub4, language: 'en'},
    {entity: 'shared1', template: 'relation2', hub: hub4, language: 'en'},
    {entity: 'shared1', template: 'relation2', hub: hub5, language: 'en'},
    {entity: 'shared', template: 'relation2', hub: hub5, language: 'en'}
  ]
};

export {
  batmanFinishesId,
  syncPropertiesEntityId,
  templateId,
  templateChangingNames,
  templateWithEntityAsThesauri
};
