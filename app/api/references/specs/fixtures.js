/* eslint-disable */
import db from 'api/utils/testing_db';
const connectionID1 = db.id();
const inbound = db.id();
const template = db.id();
const thesauri = db.id();
const templateWithoutProperties = db.id();
const selectValueID = db.id().toString();
const value1ID = db.id().toString();
const value2ID = db.id().toString();
const templateChangingNames = db.id();
const relation3 = db.id();
const relation4 = db.id();


const hub1 = db.id();
const hub2 = db.id();
const hub3 = db.id();
const hub4 = db.id();
const hub5 = db.id();
const hub6 = db.id();
const hub7 = db.id();
const hub8 = db.id();

export default {
  connections: [
    {entity: 'source1', hub: hub1, range: {text: 'sourceRange'}, template: relation3},
    {entity: 'source2', hub: hub1, range: {text: ''}, template: relation3, language: 'es'},
    // {sourceDocument: 'source1', targetDocument: 'source2', targetRange: {for: 'range1', text: ''}, sourceRange: {text: 'sourceRange'}, template: relation3},

    {entity: 'source2', hub: hub2, range: {text: 'range2'}, template: relation4, language: 'en'},
    {entity: 'doc3', hub: hub2, range: {text: 'targetRange'}, template: relation4},
    // {sourceDocument: 'source2', targetDocument: 'doc3', sourceRange: {for: 'range2', text: 'range2'}, targetRange: {text: 'targetRange'}, template: relation4},

    {entity: 'source2', hub: hub3, range: {text: 'range3'}, template: relation4},
    {entity: 'doc4', hub: hub3, range: {text: ''}, template: relation4},
    // {sourceDocument: 'source2', targetDocument: 'doc4', sourceRange: {for: 'range3', text: 'range3'}, template: relation4},

    {entity: 'doc5', hub: hub4, template: relation3},
    {entity: 'source2', hub: hub4, template: relation3, sourceType: 'metadata', entityTemplate: templateChangingNames, entityProperty: 'selectName'},
    // {sourceDocument: 'doc5', targetDocument: 'source2', targetRange: 'range1', template: relation3, entityType: 'metadata', entityTemplate: templateChangingNames, entityProperty: 'property3'},

    {entity: 'target', hub: hub5, entityType: 'metadata', entityTemplate: templateChangingNames, entityProperty: 'property1'},
    {entity: 'target', hub: hub5, entityType: 'metadata', entityTemplate: templateChangingNames, entityProperty: 'property1'},
    // {targetDocument: 'target', entityType: 'metadata', entityTemplate: templateChangingNames, entityProperty: 'property1'},

    {entity: 'target1', hub: hub6, entityType: 'metadata', entityTemplate: templateChangingNames, entityProperty: 'property2'},
    // {targetDocument: 'target1', entityType: 'metadata', entityTemplate: templateChangingNames, entityProperty: 'property2'},

    {_id: connectionID1, entity: 'entity_id', hub: hub7, range: {text: 'sourceRange'}, template: relation3},
    {entity: value2ID, hub: hub7, range: 'range1', template: relation3},
    // {_id: sourceDocument, entityDocument: 'entity_id', targetDocument: value2ID, targetRange: 'range1', entityRange: {text: 'sourceRange'}, template: relation3},

    ////inbound existing reference
    {_id: inbound, entity: value2ID, hub: hub8, entityType: 'metadata', entityProperty: 'selectName'},
    {entity: 'entity_id', entityType: 'metadata', hub: hub8, entityProperty: 'selectName'}
    // {_id: inbound, type: 'reference', entityDocument: value2ID, targetDocument: 'entity_id', entityType: 'metadata', entityProperty: 'selectName'}
  ],
  templates: [
    {_id: templateWithoutProperties},
    {_id: template, name: 'template', properties: [{
      name: 'selectName',
      type: 'select',
      label: 'select name',
      content: templateWithoutProperties
    },
    {
      name: 'multiSelectName',
      type: 'multiselect',
      label: 'multiselect name',
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
    {sharedId: 'source1', language: 'es', title: 'source1 title', type: 'document', template: template, file: {language: 'spa'}, icon: 'icon1', metadata: {data: 'data1'}, creationDate: 123},
    {sharedId: 'source2', language: 'es', title: 'source2 title', type: 'document', template: template, file: {language: 'spa'}, icon: 'icon1', metadata: {data: 'data2'}, creationDate: 123},
    {sharedId: 'doc3', language: 'es', title: 'doc3 title', type: 'entity', template: template, published: true, icon: 'icon3', metadata: {data: 'data2'}, creationDate: 456},
    {sharedId: 'doc4', language: 'es', title: 'doc4 title', type: 'document', template: template, file: {language: 'eng'}, metadata: {data: 'data3'}, creationDate: 789},
    {sharedId: 'doc5', language: 'es', title: 'doc5 title', type: 'document', template: template, published: true},
    {sharedId: selectValueID, language: 'es', title: 'selectValue', type: 'entity'},
    {sharedId: value1ID, language: 'es', title: 'value1', type: 'entity'},
    {sharedId: value2ID, language: 'es', title: 'value2', type: 'entity', template}
  ],
  dictionaries: [
    {_id: thesauri}
  ],
  relationtypes: [
    {_id: relation3, name: 'relation 1', type: 'relationtype'},
    {_id: relation4, name: 'relation 2', type: 'relationtype'}
  ]
};

export {
  template,
  inbound,
  connectionID1,
  selectValueID,
  value1ID,
  value2ID,
  templateChangingNames,
  templateWithoutProperties,
  relation3,
  relation4,
  hub1,
  hub2,
  hub3,
  hub4,
  hub5,
  hub6,
  hub7
};
