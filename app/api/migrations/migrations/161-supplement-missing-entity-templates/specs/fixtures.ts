import { ObjectId } from 'mongodb';
import { Entity, Fixture } from '../types';

const template1 = new ObjectId();
const template2 = new ObjectId();
const template3 = new ObjectId();

const entities: Entity[] = [
  { sharedId: 's1', title: 'entity1', template: template1 },
  { sharedId: 's2', title: 'entity2', template: template2 },
  { sharedId: 's3', title: 'entity3' },
  { sharedId: 's4', title: 'entity4', template: template2 },
  { sharedId: 's5', title: 'entity5', template: undefined },
  { sharedId: 's6', title: 'entity6', template: template3 },
  // @ts-ignore - intentional wrong fixture
  { sharedId: 's5', title: 'entity5', template: null },
];

const fixtures: Fixture = {
  entities,
  templates: [
    { _id: template1, name: 't1' },
    { _id: template2, name: 't2', default: true },
    { _id: template3, name: 't3' },
  ],
};

const noDefaultTemplate = {
  entities,
  templates: [
    { _id: template1, name: 't1' },
    { _id: template2, name: 't2' },
    { _id: template3, name: 't3' },
  ],
};

const correctFixture = {
  entities: [
    { sharedId: 's1', title: 'entity1', template: template1 },
    { sharedId: 's2', title: 'entity2', template: template2 },
    { sharedId: 's3', title: 'entity6', template: template3 },
  ],
  templates: [
    { _id: template1, name: 't1' },
    { _id: template2, name: 't2', default: true },
    { _id: template3, name: 't3' },
  ],
};

export { fixtures, noDefaultTemplate, correctFixture, template1, template2, template3 };
