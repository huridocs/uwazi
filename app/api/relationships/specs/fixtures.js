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
const hub11 = db.id();

const sharedId1 = db.id();
const sharedId2 = db.id();
const sharedId3 = db.id();

export default {
  connections: [
    {entity: 'entity1', hub: hub1, language: 'en', template: relation1, sharedId: db.id()},
    {entity: 'entity2', hub: hub1, language: 'en', template: relation1, sharedId: db.id()},

    {entity: 'entity2', hub: hub2, template: relation2, sharedId: db.id(), language: 'en'},
    {entity: 'entity3', hub: hub2, template: relation2, range: {text: 'english'}, language: 'en', sharedId: sharedId1},
    {entity: 'entity3', hub: hub2, language: 'en', sharedId: db.id()},

    {entity: 'entity2', hub: hub11, template: relation2, sharedId: db.id(), language: 'ru'},
    {entity: 'entity3', hub: hub11, template: relation2, range: {text: 'rusian'}, language: 'ru', sharedId: sharedId1},
    {entity: 'entity3', hub: hub11, language: 'en', sharedId: db.id()},

    {entity: 'entity2', hub: hub3, template: relation2, sharedId: db.id(), language: 'en'},
    {entity: 'doc4', hub: hub3, template: relation2, sharedId: db.id(), language: 'en'},

    {entity: 'doc5', hub: hub4, template: relation1, sharedId: db.id(), language: 'en'},
    {entity: 'entity2', hub: hub4, template: relation1, sharedId: db.id(), language: 'en'},
    {entity: 'entity3', hub: hub4, template: relation1, sharedId: db.id(), language: 'en'},

    {entity: 'target', hub: hub5, sharedId: db.id(), language: 'en'},
    {entity: 'target', hub: hub5, sharedId: db.id(), language: 'en'},

    {entity: 'target1', hub: hub6, sharedId: db.id(), language: 'en'},

    {_id: connectionID1, entity: 'entity_id', hub: hub7, template: relation1, sharedId: sharedId2, language: 'en'},
    {entity: 'entity_id', hub: hub7, template: relation1, sharedId: sharedId2, language: 'es'},
    {entity: value2ID, hub: hub7, range: 'range1', template: relation1, sharedId: sharedId3, language: 'en'},
    {entity: value2ID, hub: hub7, range: 'range1', template: relation1, sharedId: sharedId3, language: 'es'},
    {_id: inbound, entity: value2ID, hub: hub8, sharedId: db.id()},
    {entity: 'entity_id', hub: hub8, sharedId: db.id()},
    {entity: 'entity_id', hub: hub8, sharedId: db.id()},
    {entity: 'bruceWayne', hub: hub9, sharedId: db.id(), language: 'en'},
    {entity: 'thomasWayne', hub: hub9, template: family, sharedId: db.id(), language: 'en'},
    {entity: 'IHaveNoTemplate', hub: hub9, template: null, sharedId: db.id(), language: 'en'}
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
    {sharedId: 'entity1', language: 'en', title: 'entity1 title', type: 'document', template: template, icon: 'icon1', metadata: {data: 'data1'}, creationDate: 123},
    {sharedId: 'entity2', language: 'en', title: 'entity2 title', type: 'document', template: template, icon: 'icon1', metadata: {data: 'data2'}, creationDate: 123},
    {sharedId: 'entity3', language: 'en', title: 'entity3 title', type: 'entity', template: template, published: true, icon: 'icon3', metadata: {data: 'data2'}, creationDate: 456},
    {sharedId: 'entity3', language: 'ru', title: 'entity3 title', type: 'entity', template: template, published: true, icon: 'icon3', metadata: {data: 'data2'}, creationDate: 456},
    {sharedId: 'entity4', language: 'en', title: 'entity4 title', type: 'entity', template: template, published: true, icon: 'icon3', metadata: {data: 'data2'}, creationDate: 456},
    {sharedId: 'entity4', language: 'ru', title: 'entity4 title', type: 'entity', template: template, published: true, icon: 'icon3', metadata: {data: 'data2'}, creationDate: 456},
    {sharedId: 'doc4', language: 'en', title: 'doc4 en title', type: 'document', template: template, file: {filename: 'en'}, metadata: {data: 'data3'}, creationDate: 789},
    {sharedId: 'doc4', language: 'es', title: 'doc4 es title', type: 'document', template: template, file: {filename: 'en'}, metadata: {data: 'data3'}, creationDate: 789},
    {sharedId: 'doc4', language: 'pt', title: 'doc4 pt title', type: 'document', template: template, file: {filename: 'pt'}, metadata: {data: 'data3'}, creationDate: 789},
    {sharedId: 'doc5', language: 'en', title: 'doc5 title', type: 'document', template: template, published: true, file: {filename: 'en'}},
    {sharedId: 'doc5', language: 'es', title: 'doc5 title', type: 'document', template: template, published: true, file: {filename: 'en'}},
    {sharedId: 'doc5', language: 'pt', title: 'doc5 title', type: 'document', template: template, published: true, file: {filename: 'en'}},
    {sharedId: selectValueID, language: 'en', title: 'selectValue', type: 'entity'},
    {sharedId: value1ID, language: 'en', title: 'value1', type: 'entity'},
    {sharedId: value2ID, language: 'en', title: 'value2', type: 'entity', template},
    {sharedId: 'bruceWayne', language: 'en', title: 'bruceWayne', type: 'entity', template},
    {sharedId: 'thomasWayne', language: 'en', title: 'thomasWayne', type: 'entity', template},
    {sharedId: 'alfred', language: 'en', title: 'alfred', type: 'entity', template},
    {sharedId: 'robin', language: 'en', title: 'robin', type: 'entity', template},
    {sharedId: 'IHaveNoTemplate', language: 'en', title: 'no template', type: 'entity', template}
  ],
  dictionaries: [
    {_id: thesauri}
  ],
  relationtypes: [
    {_id: relation1, name: 'relation 1', properties: [
      {type: 'text', name: 'title'},
      {type: 'multiselect', name: 'options'},
      {type: 'date', name: 'date'}
    ]},
    {_id: relation2, name: 'relation 2'},
    {_id: friend, name: 'friend'},
    {_id: family, name: 'family'}
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
