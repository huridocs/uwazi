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
const relation1 = db.id();
const relation2 = db.id();
const friend = db.id();
const family = db.id();


const hub1 = db.id();
const hub2 = db.id();
const hub3 = db.id();
const hub4 = db.id();
const hub5 = db.id();
const hub6 = db.id();
const hub7 = db.id();
const hub8 = db.id();
const hub9 = db.id();
const hub10 = db.id();

export default {
  connections: [
    {entity: 'source1', hub: hub1, range: {text: 'sourceRange'}, template: relation1},
    {entity: 'source2', hub: hub1, range: {text: ''}, template: relation1, language: 'es'},

    {entity: 'source2', hub: hub2, range: {text: 'range2'}, template: relation2, language: 'en'},
    {entity: 'doc3', hub: hub2, range: {text: 'targetRange'}, template: relation2},

    {entity: 'source2', hub: hub3, range: {text: 'range3'}, template: relation2},
    {entity: 'doc4', hub: hub3, range: {text: ''}, template: relation2},

    {entity: 'doc5', hub: hub4, template: relation1},
    {entity: 'source2', hub: hub4, template: relation1},

    {entity: 'target', hub: hub5},
    {entity: 'target', hub: hub5},

    {entity: 'target1', hub: hub6},

    {_id: connectionID1, entity: 'entity_id', hub: hub7, range: {text: 'sourceRange'}, template: relation1},
    {entity: value2ID, hub: hub7, range: 'range1', template: relation1},
    {_id: inbound, entity: value2ID, hub: hub8},
    {entity: 'entity_id', hub: hub8},
    {entity: 'entity_id', hub: hub8},
    {entity: 'bruceWayne', hub: hub9},
    {entity: 'thomasWayne', hub: hub9, template: family}
  ],
  templates: [
    {_id: templateWithoutProperties},
    {_id: template, name: 'template', properties: [
      {
        name: 'friend',
        type: 'relationship',
        label: 'friend',
        relationType: friend
      },
      {
        name: 'family',
        type: 'relationship',
        label: 'family',
        relationType: family
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
    ]},
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
    {sharedId: value2ID, language: 'es', title: 'value2', type: 'entity', template},
    {sharedId: 'bruceWayne', language: 'es', title: 'bruceWayne', type: 'entity', template},
    {sharedId: 'thomasWayne', language: 'es', title: 'thomasWayne', type: 'entity', template},
    {sharedId: 'alfred', language: 'es', title: 'alfred', type: 'entity', template},
    {sharedId: 'robin', language: 'es', title: 'robin', type: 'entity', template}
  ],
  dictionaries: [
    {_id: thesauri}
  ],
  relationtypes: [
    {_id: relation1, name: 'relation 1', type: 'relationtype'},
    {_id: relation2, name: 'relation 2', type: 'relationtype'},
    {_id: friend, name: 'relation 1', type: 'friend'},
    {_id: family, name: 'relation 1', type: 'family'}
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
  relation1,
  relation2,
  hub1,
  hub2,
  hub3,
  hub4,
  hub5,
  hub6,
  hub7,
  hub8,
  hub9,
  hub10,
  family,
  friend
};
