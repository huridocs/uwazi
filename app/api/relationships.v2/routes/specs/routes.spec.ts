/* eslint-disable jest/no-focused-tests */
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { setUpApp } from 'api/utils/testingRoutes';
import testingDB from 'api/utils/testing_db';
import { Request, Response, NextFunction } from 'express';
import request from 'supertest';
import routes from '../routes';

const factory = getFixturesFactory();

const fixtures = {
  entities: [
    factory.entity(
      'entity1',
      'template1',
      {},
      { permissions: [{ refId: factory.id('group1'), type: 'group', level: 'write' }] }
    ),
    factory.entity(
      'entity2',
      'template1',
      {},
      { permissions: [{ refId: factory.id('user1'), type: 'user', level: 'write' }] }
    ),
  ],
  relationtypes: [{ _id: factory.id('type1') }],
  relationships: [],
  settings: [
    {
      _id: factory.id('settings'),
      languages: [{ key: 'es', default: true, label: 'es' }],
    },
  ],
};

beforeEach(async () => {
  await testingEnvironment.setUp(fixtures);
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('POST relationships', () => {
  it('shuold throw a 404 if the feature is not active', async () => {
    const app = setUpApp(routes, (req: Request, _res: Response, next: NextFunction) => {
      (req as any).user = undefined;
      next();
    });

    await request(app).post('/api/relationships.v2').send([]).expect(404);
  });

  const cases1 = [
    { from: 'entity1', to: 'entity2', type: 'some_type' },
    'random string',
    [],
    [{ property: 'non relationship object' }],
  ];

  it.each(cases1)(
    'shuold throw a validation error if the input is not an array. Case %#',
    async input => {
      await testingDB.mongodb
        ?.collection('settings')
        .updateOne(
          { _id: factory.id('settings') },
          { $set: { features: { newRelationships: true } } }
        );
      const app = setUpApp(routes, (req: Request, _res: Response, next: NextFunction) => {
        (req as any).user = { _id: factory.id('admin_user'), role: 'admin' };
        next();
      });

      await request(app).post('/api/relationships.v2').send(input).expect(422);
    }
  );

  const cases2 = [
    { user: undefined, pass: false },
    {
      user: {
        _id: factory.id('user1'),
        role: 'collaborator',
        groups: [{ _id: factory.id('group1'), name: 'group1' }],
      },
      pass: true,
    },
  ];

  it.each(cases2)(
    'should validate the user access on the entities. Case %#',
    async ({ user, pass }) => {
      await testingDB.mongodb
        ?.collection('settings')
        .updateOne(
          { _id: factory.id('settings') },
          { $set: { features: { newRelationships: true } } }
        );
      const app = setUpApp(routes, (req: Request, _res: Response, next: NextFunction) => {
        (req as any).user = user;
        next();
      });

      await request(app)
        .post('/api/relationships.v2')
        .send([{ from: 'entity1', to: 'entity2', type: factory.id('type1').toHexString() }])
        .expect(pass ? 200 : 401);
    }
  );

  it('should create the relationships', async () => {
    await testingDB.mongodb
      ?.collection('settings')
      .updateOne(
        { _id: factory.id('settings') },
        { $set: { features: { newRelationships: true } } }
      );
    const app = setUpApp(routes, (req: Request, _res: Response, next: NextFunction) => {
      (req as any).user = { _id: factory.id('admin_user'), role: 'admin' };
      next();
    });

    await request(app)
      .post('/api/relationships.v2')
      .send([
        { from: 'entity1', to: 'entity2', type: factory.id('type1').toHexString() },
        { from: 'entity2', to: 'entity1', type: factory.id('type1').toHexString() },
      ])
      .expect(200);

    expect((await testingDB.mongodb?.collection('relationships').find({}).toArray())?.length).toBe(
      2
    );
  });
});
