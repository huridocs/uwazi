import { testingEnvironment } from 'api/utils/testingEnvironment';

import { getFixturesFactory } from 'api/utils/fixturesFactory';
import testingDB, { DBFixture } from 'api/utils/testing_db';
import relationships from '../relationships';

const fixutreFactory = getFixturesFactory();

const template1 = fixutreFactory.template('template1');
const template2 = fixutreFactory.template('template2');

const entity1 = fixutreFactory.entity('entity1', 'template1');
const entity2 = fixutreFactory.entity('entity2', 'template1');
const entity3 = fixutreFactory.entity('entity3', 'template2');
const entity4 = fixutreFactory.entity('entity4', 'template2');

const relationType1 = fixutreFactory.relationType('relationType1');
const relationType2 = fixutreFactory.relationType('relationType2');

const hub1 = fixutreFactory.hub('hub1', 'entity1', [
  { entity: 'entity2', template: 'relationType1' },
  { entity: 'entity1', template: null },
]);
const hub2 = fixutreFactory.hub('hub2', 'entity1', [
  { entity: 'entity3', template: 'relationType1' },
]);
const hub3 = fixutreFactory.hub('hub3', 'entity1', [
  { entity: 'entity4', template: 'relationType2' },
]);
const hub4 = fixutreFactory.hub('hub4', 'entity1', [
  { entity: 'entity4', template: 'relationType1' },
]);

const fixtures: DBFixture = {
  templates: [template1, template2],
  entities: [entity1, entity2, entity3, entity4],
  relationtypes: [relationType1, relationType2],
  connections: [...hub1, ...hub2, ...hub3, ...hub4],
  settings: [
    {
      _id: testingDB.id(),
      languages: [
        { key: 'en', label: 'english', default: true },
        // { key: 'es', label: 'spanish' },
      ],
    },
  ],
};

describe('relationships search', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures, 'relationships_search');
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  fit('should return all hubs for a specific entity', async () => {
    const results = await relationships._search(entity1.sharedId, { sort: '_id' }, 'en', {});

    // expect(results).toMatchObject({
    //   totalHubs: 4,
    //   totalRows: 3,
    //   requestedHubs: 10,
    // });
    //
    expect(results.rows).toMatchObject([
      {
        title: entity2.title,
        connections: [
          { entity: entity2.sharedId, hub: hub1[0].hub, entityData: { title: entity2.title } },
        ],
      },
      {
        title: entity3.title,
        connections: [
          { entity: entity3.sharedId, hub: hub2[0].hub, entityData: { title: entity3.title } },
        ],
      },
      {
        title: entity4.title,
        connections: [
          { entity: entity4.sharedId, hub: hub3[0].hub, entityData: { title: entity4.title } },
          { entity: entity4.sharedId, hub: hub4[0].hub, entityData: { title: entity4.title } },
        ],
      },
      {
        title: entity1.title,
        connections: [
          { entity: entity1.sharedId, hub: hub1[0].hub },
          { entity: entity1.sharedId, hub: hub2[0].hub },
          { entity: entity1.sharedId, hub: hub3[0].hub },
          { entity: entity1.sharedId, hub: hub4[0].hub },
        ],
      },
    ]);
  });

  it('should return x number of hubs (limit) ', async () => {
    const results = await relationships._search(
      entity1.sharedId,
      { sort: '_id', limit: 2 },
      'en',
      {}
    );

    expect(results).toMatchObject({
      totalHubs: 4,
      totalRows: 3,
      requestedHubs: 2,
    });

    expect(results.rows).toMatchObject([
      {
        title: entity2.title,
        connections: [
          {
            entity: entity2.sharedId,
            hub: hub1[0].hub,
            entityData: { title: entity2.title },
            reference: { text: 'hub1 right text' },
          },
        ],
      },
      {
        title: entity3.title,
        connections: [
          { entity: entity3.sharedId, hub: hub2[0].hub, entityData: { title: entity3.title } },
        ],
      },
      {
        title: entity1.title,
        connections: [
          { entity: entity1.sharedId, hub: hub1[0].hub, reference: { text: 'hub1 left text' } },
          { entity: entity1.sharedId, hub: hub2[0].hub, reference: { text: 'hub2 left text' } },
        ],
      },
    ]);
  });

  it('should filter hubs by relation type and entity template', async () => {
    const results = await relationships._search(
      entity1.sharedId,
      {
        sort: '_id',
        filter: {
          [relationType1._id.toString()]: [relationType1._id.toString() + template1._id.toString()],
        },
      },
      'en',
      {}
    );

    expect(results).toMatchObject({
      totalHubs: 1,
      totalRows: 1,
      requestedHubs: 10,
    });

    expect(results.rows).toMatchObject([
      {
        title: entity2.title,
        connections: [
          { entity: entity2.sharedId, hub: hub1[0].hub, entityData: { title: entity2.title } },
        ],
      },
      {
        title: entity1.title,
        connections: [{ entity: entity1.sharedId, hub: hub1[0].hub }],
      },
    ]);
  });

  it('should filter hubs by relation type and entity template (templates that belong to different relationTypes)', async () => {
    const results = await relationships._search(
      entity1.sharedId,
      {
        sort: '_id',
        filter: {
          [relationType1._id.toString()]: [relationType1._id.toString() + template2._id.toString()],
        },
      },
      'en',
      {}
    );

    expect(results).toMatchObject({
      totalHubs: 2,
      totalRows: 2,
      requestedHubs: 10,
    });

    expect(results.rows[0]).toMatchObject({
      title: entity3.title,
      connections: [
        { entity: entity3.sharedId, hub: hub2[0].hub, entityData: { title: entity3.title } },
      ],
    });

    expect(results.rows[1]).toMatchObject({
      title: entity4.title,
      connections: [
        { entity: entity4.sharedId, hub: hub4[0].hub, entityData: { title: entity4.title } },
      ],
    });

    expect(results.rows[2]).toMatchObject({
      title: entity1.title,
      connections: [
        { entity: entity1.sharedId, hub: hub2[0].hub, reference: { text: 'hub2 left text' } },
        { entity: entity1.sharedId, hub: hub4[0].hub, reference: { text: 'hub4 left text' } },
      ],
    });
  });

  it('should filter properly filter hubs of templates belonging to multiple relationTypes', async () => {
    const entity1 = fixutreFactory.entity('entity1', 'template1');
    const entity2 = fixutreFactory.entity('entity2', 'template2');
    const entity3 = fixutreFactory.entity('entity3', 'template1');
    const entity4 = fixutreFactory.entity('entity4', 'template2');

    const hub1 = fixutreFactory.hub('hub1', 'entity1', [
      { entity: 'entity2', template: 'relationType1' },
    ]);
    const hub2 = fixutreFactory.hub('hub2', 'entity1', [
      { entity: 'entity3', template: 'relationType1' },
    ]);
    const hub3 = fixutreFactory.hub('hub3', 'entity1', [{ entity: 'entity4', template: null }]);
    const hub4 = fixutreFactory.hub('hub4', 'entity1', [
      { entity: 'entity3', template: 'relationType1' },
    ]);

    const fixtures: DBFixture = {
      templates: [template1, template2],
      entities: [entity1, entity2, entity3, entity4],
      relationtypes: [relationType1, relationType2],
      connections: [...hub1, ...hub2, ...hub3, ...hub4],
      settings: [
        {
          _id: testingDB.id(),
          languages: [
            { key: 'en', label: 'english', default: true },
            // { key: 'es', label: 'spanish' },
          ],
        },
      ],
    };

    await testingEnvironment.setUp(fixtures, 'relationships_search');

    const results = await relationships._search(
      entity1.sharedId,
      {
        sort: '_id',
        filter: {
          null: [null + template2._id.toString()],
          [relationType1._id.toString()]: [relationType1._id.toString() + template1._id.toString()],
        },
      },
      'en',
      {}
    );

    expect(results).toMatchObject({
      totalHubs: 3,
      totalRows: 2,
      requestedHubs: 10,
    });

    expect(results.rows[0]).toMatchObject({
      title: entity3.title,
      connections: [
        { entity: entity3.sharedId, hub: hub2[0].hub, entityData: { title: entity3.title } },
        { entity: entity3.sharedId, hub: hub4[0].hub, entityData: { title: entity3.title } },
      ],
    });

    expect(results.rows[1]).toMatchObject({
      title: entity4.title,
      connections: [
        { entity: entity4.sharedId, hub: hub3[0].hub, entityData: { title: entity4.title } },
      ],
    });

    expect(results.rows[2]).toMatchObject({
      title: entity1.title,
      connections: [
        { entity: entity1.sharedId, hub: hub2[0].hub, reference: { text: 'hub2 left text' } },
        { entity: entity1.sharedId, hub: hub4[0].hub, reference: { text: 'hub4 left text' } },
        { entity: entity1.sharedId, hub: hub3[0].hub, reference: { text: 'hub3 left text' } },
      ],
    });
  });
});
