import {db} from 'api/utils';

const template = db.id();
const entityTemplate = db.id();
const template1Id = db.id();
const template2Id = db.id();
const template3Id = db.id();
const thesauri = db.id();
const relation1 = db.id();
const relation2 = db.id();

export default {
  connections: [
    {title: 'reference1', sourceDocument: 'source1', targetDocument: 'source2', language: 'es', targetRange: {text: ''}, sourceRange: {text: 'sourceRange'}, relationType: relation1},
    {title: 'reference2', sourceDocument: 'source2', targetDocument: 'doc3', language: 'en', sourceRange: {text: 'range2'}, targetRange: {text: 'targetRange'}, relationType: relation2},
    {title: 'reference3', sourceDocument: 'source2', targetDocument: 'doc4', language: 'es', sourceRange: {text: 'range3'}, relationType: relation2},
    {title: 'reference4', sourceDocument: 'doc5', targetDocument: 'source2', targetRange: 'range1', relationType: relation1},
    {title: 'targetDocument', targetDocument: 'target'},
    {title: 'targetDocument', targetDocument: 'target'},
    {title: 'targetDocument1', targetDocument: 'target1'},
    {title: 'reference5', sourceDocument: 'source2', targetDocument: 'doc4', language: 'es', sourceRange: {text: 'range3'}, relationType: relation2},
    {title: 'reference5', sourceDocument: 'source2', targetDocument: 'doc6', language: 'es', sourceRange: {text: 'range3'}, relationType: relation2},
    //document-based existing reference
    {title: 'reference1', sourceDocument: 'entity_id', targetDocument: 'value2ID', targetRange: 'range1', sourceRange: {text: 'sourceRange'}, relationType: relation1},
    {title: 'reference5', sourceDocument: 'doc3', targetDocument: 'source2', targetRange: 'range1', sourceRange: {text: 'sourceRange'}, relationType: relation1},
    //inbound existing reference
    {title: 'indound_reference_1', sourceDocument: 'value2ID', targetDocument: 'entity_id', sourceType: 'metadata', sourceProperty: 'selectName'},
    //outbound existing reference
    {title: 'outbount_reference_1', sourceDocument: 'source2', targetDocument: 'doc3', sourceType: 'metadata', sourceProperty: 'selectName'},
    {title: 'outbount_reference_2', sourceDocument: 'doc3', targetDocument: 'source2', sourceType: 'metadata', sourceProperty: 'selectName'}
  ],
  entities: [
    {sharedId: 'source1', language: 'es', title: 'source1 title', type: 'document', template: template3Id, published: true, icon: 'icon1', metadata: {data: 'data1'}, creationDate: 123},
    {sharedId: 'doc3', language: 'es', title: 'doc3 title', type: 'entity', template: template1Id, published: true, icon: 'icon3', metadata: {data: 'data2'}, creationDate: 456},
    {sharedId: 'doc4', language: 'es', title: 'doc4 title', type: 'document', template: template1Id, published: true, metadata: {data: 'data3'}, creationDate: 789},
    {sharedId: 'doc5', language: 'es', title: 'doc5 title', type: 'document', template: template2Id, published: true},
    {sharedId: 'doc6', language: 'es', title: 'doc6 title', type: 'entity', template: template1Id, published: false, icon: 'icon3', metadata: {data: 'data2'}, creationDate: 456},
    //selectValues
    {sharedId: 'selectValueID', language: 'es', title: 'selectValue', type: 'entity'},
    {sharedId: 'value1ID', language: 'es', title: 'value1', type: 'entity'},
    {sharedId: 'value2ID', language: 'es', title: 'value2', type: 'entity', template}

  ],
  templates: [
    {_id: entityTemplate},
    {_id: template1Id, name: 'template 1', properties: [{
      name: 'selectName',
      type: 'select',
      label: 'Select Name',
      content: entityTemplate
    }]},
    {_id: template2Id, name: 'template 2'},
    {_id: template3Id, name: 'template 3'},
    {_id: template, properties: [
      {
        name: 'selectName',
        type: 'select',
        content: entityTemplate
      },
      {
        name: 'multiSelectName',
        type: 'multiselect',
        content: entityTemplate
      },
      {
        name: 'dictionarySelect',
        type: 'select',
        content: thesauri
      },
      {
        name: 'dictionaryMultiSelect',
        type: 'multiselect',
        content: thesauri
      },
      {
        name: 'otherName',
        type: 'other'
      }
    ]}
  ],
  dictionaries: [
    {_id: thesauri}
  ],
  relationtypes: [
    {_id: relation1, name: 'relation 1', type: 'relationtype'},
    {_id: relation2, name: 'relation 2', type: 'relationtype'}
  ]
};

export {
  template,
  entityTemplate,
  template1Id,
  template2Id,
  template3Id,
  thesauri,
  relation1,
  relation2
};
