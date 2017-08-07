import db from 'api/utils/testing_db';
const inbound = db.id();
const template = db.id();
const thesauri = db.id();
const sourceDocument = db.id();
const templateWithoutProperties = db.id();
const selectValueID = db.id().toString()
const value1ID = db.id().toString()
const value2ID = db.id().toString()
const templateChangingNames = db.id();

export default {
  connections: [
    {title: 'reference1', sourceDocument: 'source1', targetDocument: 'source2', language: 'es', targetRange: {for: 'range1', text: ''}, sourceRange: {text: 'sourceRange'}, relationType: 'relation1'},
    {title: 'reference2', sourceDocument: 'source2', targetDocument: 'doc3', language: 'en', sourceRange: {for: 'range2', text: 'range2'}, targetRange: {text: 'targetRange'}, relationType: 'relation2'},
    {title: 'reference3', sourceDocument: 'source2', targetDocument: 'doc4', language: 'es', sourceRange: {for: 'range3', text: 'range3'}, relationType: 'relation2'},
    {title: 'reference4', sourceDocument: 'doc5', targetDocument: 'source2', targetRange: 'range1', relationType: 'relation1', sourceType: 'metadata', sourceTemplate: templateChangingNames, sourceProperty: 'property3'},
    {title: 'targetDocument', targetDocument: 'target', sourceType: 'metadata', sourceTemplate: templateChangingNames, sourceProperty: 'property1'},
    {title: 'targetDocument', targetDocument: 'target', sourceType: 'metadata', sourceTemplate: templateChangingNames, sourceProperty: 'property1'},
    {title: 'targetDocument1', targetDocument: 'target1', sourceType: 'metadata', sourceTemplate: templateChangingNames, sourceProperty: 'property2'},
    {_id: sourceDocument, title: 'reference1', sourceDocument: 'entity_id', targetDocument: value2ID, targetRange: 'range1', sourceRange: {text: 'sourceRange'}, relationType: 'relation1'},
    ////inbound existing reference
    {_id: inbound, type: 'reference', title: 'indound_reference_1', sourceDocument: value2ID, targetDocument: 'entity_id', sourceType: 'metadata', sourceProperty: 'selectName'},
  ],
  templates: [
    {_id: templateWithoutProperties},
    {_id: template, properties: [{
      name: 'selectName',
      type: 'select',
      content: templateWithoutProperties
    },
    {
      name: 'multiSelectName',
      type: 'multiselect',
      content: templateWithoutProperties
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
    }]},
    {_id: templateChangingNames, name: 'template_changing_names', properties: [
      {id: '1', type: 'text', name: 'property1'},
      {id: '2', type: 'text', name: 'property2'},
      {id: '3', type: 'text', name: 'property3'}
    ]}
  ],
  entities: [
    {sharedId: 'source1', language: 'es', title: 'source1 title', type: 'document', template: 'template3_id', file: {language: 'spa'}, icon: 'icon1', metadata: {data: 'data1'}, creationDate: 123},
    {sharedId: 'doc3', language: 'es', title: 'doc3 title', type: 'entity', template: 'template1_id', published: true, icon: 'icon3', metadata: {data: 'data2'}, creationDate: 456},
    {sharedId: 'doc4', language: 'es', title: 'doc4 title', type: 'document', template: 'template1_id', file: {language: 'eng'}, metadata: {data: 'data3'}, creationDate: 789},
    {sharedId: 'doc5', language: 'es', title: 'doc5 title', type: 'document', template: 'template2_id'},
    {sharedId: selectValueID, language: 'es', title: 'selectValue', type: 'entity'},
    {sharedId: value1ID, language: 'es', title: 'value1', type: 'entity'},
    {sharedId: value2ID, language: 'es', title: 'value2', type: 'entity', template}
  ],
  dictionaries: [
    {_id: thesauri}
  ]
};

export {
  template,
  inbound,
  sourceDocument,
  selectValueID,
  value1ID,
  value2ID,
  templateChangingNames,
  templateWithoutProperties
};
