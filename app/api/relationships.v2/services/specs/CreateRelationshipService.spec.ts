/* eslint-disable max-statements */
import { MongoPermissionsDataSource } from 'api/authorization.v2/database/MongoPermissionsDataSource';
import { AuthorizationService } from 'api/authorization.v2/services/AuthorizationService';
import { getConnection, getClient } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoIdGenerator } from 'api/common.v2/database/MongoIdGenerator';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { MongoEntitiesDataSource } from 'api/entities.v2/database/MongoEntitiesDataSource';
import { MissingEntityError } from 'api/entities.v2/errors/entityErrors';
import { applicationEventsBus } from 'api/eventsbus';
import { spyOnEmit } from 'api/eventsbus/eventTesting';
import { MongoRelationshipsDataSource } from 'api/relationships.v2/database/MongoRelationshipsDataSource';
import { RelationshipsCreatedEvent } from 'api/relationships.v2/events/RelationshipsCreatedEvent';
import { MongoRelationshipTypesDataSource } from 'api/relationshiptypes.v2/database/MongoRelationshipTypesDataSource';
import { MongoSettingsDataSource } from 'api/settings.v2/database/MongoSettingsDataSource';
import { MongoTemplatesDataSource } from 'api/templates.v2/database/MongoTemplatesDataSource';
import { User } from 'api/users.v2/model/User';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import testingDB from 'api/utils/testing_db';
import { ObjectId } from 'mongodb';
import { SelfReferenceError } from '../../errors/relationshipErrors';
import { CreateRelationshipService } from '../CreateRelationshipService';
import { DenormalizationService } from '../DenormalizationService';

const factory = getFixturesFactory();

const collectionInDb = (collection = 'relationships') => testingDB.mongodb?.collection(collection)!;

const entityInLanguages = (langs: string[], id: string, template?: string) =>
  langs.map(lang => factory.entity(id, template, {}, { language: lang }));

const mockUser = new User(MongoIdGenerator.generate(), 'admin', []);

const createService = () => {
  const connection = getConnection();
  const transactionManager = new MongoTransactionManager(getClient());
  const SettingsDataSource = new MongoSettingsDataSource(connection, transactionManager);

  return new CreateRelationshipService(
    new MongoRelationshipsDataSource(connection, transactionManager),
    new MongoRelationshipTypesDataSource(connection, transactionManager),
    new MongoEntitiesDataSource(
      connection,
      new MongoRelationshipsDataSource(connection, transactionManager),
      SettingsDataSource,
      transactionManager
    ),
    transactionManager,
    MongoIdGenerator,
    new AuthorizationService(
      new MongoPermissionsDataSource(connection, transactionManager),
      mockUser
    ),
    new DenormalizationService(
      new MongoRelationshipsDataSource(connection, transactionManager),
      new MongoEntitiesDataSource(
        connection,
        new MongoRelationshipsDataSource(connection, transactionManager),
        SettingsDataSource,
        transactionManager
      ),
      new MongoTemplatesDataSource(connection, transactionManager),
      transactionManager,
      applicationEventsBus
    )
  );
};

const fixtures = {
  entities: [
    ...entityInLanguages(['en', 'hu'], 'entity1', 'template1'),
    ...entityInLanguages(['en', 'hu'], 'entity2', 'template2'),
    ...entityInLanguages(['en', 'hu'], 'entity3', 'template1'),
    ...entityInLanguages(['en', 'hu'], 'entity4', 'template3'),
    ...entityInLanguages(['en', 'hu'], 'entity5', 'template1'),
  ],
  relationships: [],
  relationtypes: [
    {
      _id: factory.id('rel1'),
      name: 'rel1',
    },
    {
      _id: factory.id('rel2'),
      name: 'rel2',
    },
    {
      _id: factory.id('rel3'),
      name: 'rel3',
    },
    {
      _id: factory.id('rel4'),
      name: 'rel4',
    },
  ],
  templates: [
    factory.template('template1'),
    factory.template('template2'),
    factory.template('template3', [
      factory.property('relProp', 'newRelationship', {
        query: [
          {
            direction: 'out',
            types: [factory.id('rel4')],
            match: [
              {
                templates: [factory.id('template1')],
              },
              {
                templates: [factory.id('template2')],
                traverse: [
                  {
                    direction: 'out',
                    types: [factory.id('rel4')],
                    match: [{ templates: [factory.id('template1')] }],
                  },
                ],
              },
            ],
          },
        ],
      }),
    ]),
  ],
  settings: [
    {
      languages: [
        {
          default: true,
          label: 'English',
          key: 'en',
        },
        {
          default: true,
          label: 'Hungarian',
          key: 'hu',
        },
      ],
    },
  ],
};

beforeEach(async () => {
  await testingEnvironment.setUp(fixtures);
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('createMultiple()', () => {
  describe('When the entities exist', () => {
    it('should return new connections', async () => {
      const service = createService();

      const relationship = await service.createMultiple([
        { from: 'entity1', to: 'entity2', type: factory.id('rel1').toHexString() },
        { from: 'entity2', to: 'entity1', type: factory.id('rel2').toHexString() },
        { from: 'entity3', to: 'entity1', type: factory.id('rel3').toHexString() },
      ]);

      expect(relationship).toEqual([
        {
          _id: expect.any(String),
          from: 'entity1',
          to: 'entity2',
          type: factory.id('rel1').toHexString(),
        },
        {
          _id: expect.any(String),
          from: 'entity2',
          to: 'entity1',
          type: factory.id('rel2').toHexString(),
        },
        {
          _id: expect.any(String),
          from: 'entity3',
          to: 'entity1',
          type: factory.id('rel3').toHexString(),
        },
      ]);
    });

    it('should persist new connections', async () => {
      const service = createService();
      await service.createMultiple([
        { from: 'entity1', to: 'entity2', type: factory.id('rel1').toHexString() },
        { from: 'entity2', to: 'entity1', type: factory.id('rel2').toHexString() },
        { from: 'entity3', to: 'entity1', type: factory.id('rel3').toHexString() },
      ]);

      const relatinshipsInDb = await collectionInDb().find({}).sort({ from: 1 }).toArray();

      expect(relatinshipsInDb).toEqual([
        {
          _id: expect.any(ObjectId),
          from: 'entity1',
          to: 'entity2',
          type: factory.id('rel1'),
        },
        {
          _id: expect.any(ObjectId),
          from: 'entity2',
          to: 'entity1',
          type: factory.id('rel2'),
        },
        {
          _id: expect.any(ObjectId),
          from: 'entity3',
          to: 'entity1',
          type: factory.id('rel3'),
        },
      ]);
    });

    it('should denormalize the fields over 1 hop', async () => {
      const emitSpy = spyOnEmit();
      const service = createService();

      const created = await service.createMultiple([
        { from: 'entity4', to: 'entity1', type: factory.id('rel4').toHexString() },
        { from: 'entity4', to: 'entity3', type: factory.id('rel4').toHexString() },
      ]);

      const [entity4] = await collectionInDb('entities').find({ sharedId: 'entity4' }).toArray();
      const [entity1] = await collectionInDb('entities').find({ sharedId: 'entity1' }).toArray();
      const [entity3] = await collectionInDb('entities').find({ sharedId: 'entity3' }).toArray();

      expect(entity4).toMatchObject({
        obsoleteMetadata: ['relProp'],
      });
      expect(entity1).toMatchObject(fixtures.entities[0]);
      expect(entity3).toMatchObject(fixtures.entities[4]);

      emitSpy.expectToEmitEventWith(RelationshipsCreatedEvent, {
        relationships: created,
        markedEntities: expect.arrayContaining(['entity4']),
      });

      emitSpy.restore();
    });

    it('should denormalize the fields over 2 hops', async () => {
      let emitSpy = spyOnEmit();
      const service1 = createService();

      const [created1] = await service1.createMultiple([
        { from: 'entity4', to: 'entity2', type: factory.id('rel4').toHexString() },
      ]);

      emitSpy.expectToEmitEventWith(RelationshipsCreatedEvent, {
        relationships: [created1],
        markedEntities: expect.arrayContaining(['entity4']),
      });

      emitSpy = spyOnEmit();
      const service2 = createService();
      const [created2] = await service2.createMultiple([
        { from: 'entity2', to: 'entity5', type: factory.id('rel4').toHexString() },
      ]);

      emitSpy.expectToEmitEventWith(RelationshipsCreatedEvent, {
        relationships: [created2],
        markedEntities: expect.arrayContaining(['entity4']),
      });

      const [entity4] = await collectionInDb('entities').find({ sharedId: 'entity4' }).toArray();
      const [entity1] = await collectionInDb('entities').find({ sharedId: 'entity1' }).toArray();
      const [entity3] = await collectionInDb('entities').find({ sharedId: 'entity3' }).toArray();

      expect(entity4).toMatchObject({
        obsoleteMetadata: ['relProp'],
      });
      expect(entity1).toEqual(fixtures.entities[0]);
      expect(entity3).toEqual(fixtures.entities[4]);

      emitSpy.restore();
    });
  });

  describe('When an entity does not exist', () => {
    it('should throw a validation error', async () => {
      const service = createService();
      try {
        await service.createMultiple([
          { from: 'entity1', to: 'entity2', type: factory.id('rel1').toHexString() },
          { from: 'entity2', to: 'non-existing', type: factory.id('rel2').toHexString() },
          { from: 'entity3', to: 'entity1', type: factory.id('rel3').toHexString() },
        ]);
        fail('should throw error');
      } catch (e) {
        await expect(e.message).toMatch(/existing/);
        expect(e).toBeInstanceOf(MissingEntityError);
      }
    });
  });

  describe('When trying to create a self-referencing relationship', () => {
    it('should throw a validation error', async () => {
      const service = createService();
      try {
        await service.createMultiple([
          { from: 'entity1', to: 'entity2', type: factory.id('rel1').toHexString() },
          { from: 'entity1', to: 'entity1', type: factory.id('rel2').toHexString() },
          { from: 'entity3', to: 'entity1', type: factory.id('rel3').toHexString() },
        ]);
        fail('should throw error');
      } catch (e) {
        await expect(e.message).toMatch(/self/);
        expect(e).toBeInstanceOf(SelfReferenceError);
      }
    });
  });
});
