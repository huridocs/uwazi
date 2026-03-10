import db from 'api/utils/testing_db';

const hub1RelatedToProp1 = db.id();
const hub2RelatedToProp1 = db.id();
const hub1RelatedToProp2 = db.id();
const hub2RelatedToProp2 = db.id();
const hubRelatedToProp3 = db.id();
const hubRelatedToNoProps = db.id();

const relationType1 = db.id();
const relationType2 = db.id();

const withRepetitionHub1Prop1 = [
  { _id: db.id(), entity: 'entity1', hub: hub1RelatedToProp1, template: null },
  { _id: db.id(), entity: 'entity2', hub: hub1RelatedToProp1, template: relationType1 },
  { _id: db.id(), entity: 'entity3', hub: hub1RelatedToProp1, template: relationType1 },
  { _id: db.id(), entity: 'entity3', hub: hub1RelatedToProp1, template: relationType1 },
  { _id: db.id(), entity: 'entity3', hub: hub1RelatedToProp1, template: relationType1 },
];

const withRepetitionHub2Prop1 = [
  { _id: db.id(), entity: 'entityA', hub: hub2RelatedToProp1, template: null },
  { _id: db.id(), entity: 'entityB', hub: hub2RelatedToProp1, template: relationType1 },
  { _id: db.id(), entity: 'entityC', hub: hub2RelatedToProp1, template: relationType1 },
  { _id: db.id(), entity: 'entityC', hub: hub2RelatedToProp1, template: relationType1 },
  { _id: db.id(), entity: 'entityC', hub: hub2RelatedToProp1, template: relationType1 },
];

const withRepetitionProp2 = [
  { _id: db.id(), entity: 'entity4', hub: hub1RelatedToProp2, template: null },
  { _id: db.id(), entity: 'entity5', hub: hub1RelatedToProp2, template: relationType2 },
  { _id: db.id(), entity: 'entity5', hub: hub1RelatedToProp2, template: relationType2 },
  { _id: db.id(), entity: 'entity5', hub: hub1RelatedToProp2, template: relationType2 },
  { _id: db.id(), entity: 'entity5', hub: hub1RelatedToProp2, template: relationType2 },
];

const withoutRepetitionProp2 = [
  { _id: db.id(), entity: 'entity6', hub: hub2RelatedToProp2, template: null },
  { _id: db.id(), entity: 'entity7', hub: hub2RelatedToProp2, template: relationType2 },
  { _id: db.id(), entity: 'entity8', hub: hub2RelatedToProp2, template: relationType2 },
];

const withRepetitionProp3 = [
  { _id: db.id(), entity: 'entity9', hub: hubRelatedToProp3, template: null },
  { _id: db.id(), entity: 'entity10', hub: hubRelatedToProp3, template: relationType1 },
  { _id: db.id(), entity: 'entity10', hub: hubRelatedToProp3, template: relationType1 },
];

const withRepetitionNoProp = [
  { _id: db.id(), entity: 'entity11', hub: hubRelatedToNoProps, template: null },
  { _id: db.id(), entity: 'entity12', hub: hubRelatedToNoProps, template: relationType2 },
  { _id: db.id(), entity: 'entity13', hub: hubRelatedToNoProps, template: relationType1 },
  { _id: db.id(), entity: 'entity13', hub: hubRelatedToNoProps, template: relationType1 },
];

const targetTemplate = {
  _id: db.id(),
  name: 'template2',
  properties: [],
};

const template1 = {
  _id: db.id(),
  name: 'template1',
  properties: [
    {
      _id: db.id(),
      name: 'text1',
      label: 'text1',
      type: 'text',
    },
    {
      _id: db.id(),
      name: 'prop1',
      label: 'prop1',
      type: 'relationship',
      relationType: relationType1.toString(),
      content: targetTemplate._id.toString(),
    },
    {
      _id: db.id(),
      name: 'prop2',
      label: 'prop2',
      type: 'relationship',
      relationType: relationType2.toString(),
      content: targetTemplate._id.toString(),
    },
  ],
};

const template2 = {
  _id: db.id(),
  name: 'template2',
  properties: [
    {
      _id: db.id(),
      name: 'prop3',
      label: 'prop3',
      type: 'relationship',
      relationType: relationType1.toString(),
      content: targetTemplate._id.toString(),
    },
  ],
};

export const fixtures = {
  templates: [targetTemplate, template1, template2],
  entities: [
    { _id: db.id(), language: 'en', sharedId: 'entity1', template: template1._id },
    { _id: db.id(), language: 'en', sharedId: 'entity2', template: targetTemplate._id },
    { _id: db.id(), language: 'en', sharedId: 'entity3', template: targetTemplate._id },
    { _id: db.id(), language: 'en', sharedId: 'entity4', template: template1._id },
    { _id: db.id(), language: 'en', sharedId: 'entity5', template: targetTemplate._id },
    { _id: db.id(), language: 'en', sharedId: 'entity6', template: template1._id },
    { _id: db.id(), language: 'en', sharedId: 'entity7', template: targetTemplate._id },
    { _id: db.id(), language: 'en', sharedId: 'entity8', template: targetTemplate._id },
    { _id: db.id(), language: 'en', sharedId: 'entity9', template: template2._id },
    { _id: db.id(), language: 'en', sharedId: 'entity10', template: targetTemplate._id },
    { _id: db.id(), language: 'en', sharedId: 'entity11', template: template1._id },
    { _id: db.id(), language: 'en', sharedId: 'entity12', template: template2._id },
    { _id: db.id(), language: 'en', sharedId: 'entity13', template: targetTemplate._id },
    { _id: db.id(), language: 'en', sharedId: 'entityA', template: template1._id },
    { _id: db.id(), language: 'en', sharedId: 'entityB', template: targetTemplate._id },
    { _id: db.id(), language: 'en', sharedId: 'entityC', template: targetTemplate._id },
  ],
  connections: [
    ...withRepetitionHub1Prop1,
    ...withRepetitionHub2Prop1,
    ...withRepetitionProp2,
    ...withoutRepetitionProp2,
    ...withRepetitionProp3,
    ...withRepetitionNoProp,
  ],
};

export {
  withRepetitionHub1Prop1,
  withRepetitionHub2Prop1,
  withRepetitionProp2,
  withoutRepetitionProp2,
  withRepetitionProp3,
  withRepetitionNoProp,
};
