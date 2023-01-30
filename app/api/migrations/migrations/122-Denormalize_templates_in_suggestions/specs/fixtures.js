import { ObjectId } from 'mongodb';

const templateId2 = new ObjectId();

export const fixtures = {
  entities: [
    { title: 'entity1', sharedId: 'shared1', template: new ObjectId() },
    { title: 'entity2', sharedId: 'shared2', template: templateId2 },
    { title: 'entity3', sharedId: 'shared3', template: new ObjectId() },
  ],
  ixsuggestions: [
    {
      entityId: 'shared1',
    },
    {
      entityId: 'shared2',
      entityTemplate: templateId2.toString(),
    },
    {
      entityId: 'shared3',
    },
  ],
};
