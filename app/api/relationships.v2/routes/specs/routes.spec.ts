import { Request, Response, NextFunction } from 'express';
import request from 'supertest';

import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { setUpApp } from 'api/utils/testingRoutes';
import testingDB, { DBFixture } from 'api/utils/testing_db';
import { UserRole } from 'shared/types/userSchema';
import routes from '../routes';

const URL = '/api/v2/relationships';

const factory = getFixturesFactory();

const adminUser = factory.user('admin', UserRole.ADMIN, 'admin');

const fixtures: DBFixture = {
  templates: [factory.template('template1')],
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
  relationtypes: [factory.relationType('type1'), factory.relationType('type2')],
  relationships: [
    {
      _id: factory.id('relationship1'),
      from: { entity: 'entity1' },
      to: { entity: 'entity2' },
      type: factory.id('type2'),
    },
  ],
  settings: [
    {
      _id: factory.id('settings'),
      languages: [{ key: 'es', default: true, label: 'es' }],
      features: {
        newRelationships: true,
      },
    },
  ],
  files: [factory.file('file1', 'entity1', 'document', 'file1.pdf')],
  users: [adminUser],
};

beforeEach(async () => {
  await testingEnvironment.setUp(fixtures);
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('GET relationships', () => {
  it('should should throw a 404 if the feature toggle is not active', async () => {
    await testingDB.mongodb
      ?.collection('settings')
      .updateOne({ _id: factory.id('settings') }, { $set: { features: {} } });

    const app = setUpApp(routes, (req: Request, _res: Response, next: NextFunction) => {
      (req as any).user = undefined;
      next();
    });

    await request(app).get(URL).expect(404);
  });

  it('should return the relationships with readable data', async () => {
    const app = setUpApp(routes, (req: Request, _res: Response, next: NextFunction) => {
      (req as any).user = adminUser;
      next();
    });

    const response = await request(app).get(`${URL}?sharedId=entity2`).expect(200);
    expect(response.body).toEqual([
      {
        _id: factory.id('relationship1').toString(),
        from: { entity: 'entity1', entityTitle: 'entity1', entityTemplateName: 'template1' },
        to: { entity: 'entity2', entityTitle: 'entity2', entityTemplateName: 'template1' },
        type: factory.id('type2').toString(),
        relationshipTypeName: 'type2',
      },
    ]);
  });
});

describe('POST relationships', () => {
  it('should should throw a 404 if the feature toggle is not active', async () => {
    await testingDB.mongodb
      ?.collection('settings')
      .updateOne({ _id: factory.id('settings') }, { $set: { features: {} } });

    const app = setUpApp(routes, (req: Request, _res: Response, next: NextFunction) => {
      (req as any).user = undefined;
      next();
    });

    await request(app).post(URL).send([]).expect(404);
  });

  const cases = [
    { from: 'entity1', to: 'entity2', type: 'some_type' },
    'random string',
    [{ property: 'non relationship object' }],
    undefined,
  ];

  it.each(cases)(
    'should throw a validation error if the input is not an array of relationships. Case %#',
    async input => {
      const app = setUpApp(routes, (req: Request, _res: Response, next: NextFunction) => {
        (req as any).user = { _id: factory.id('admin_user'), role: 'admin' };
        next();
      });

      await request(app).post(URL).send(input).expect(422);
    }
  );

  const cases1 = [
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

  it.each(cases1)(
    'should validate the user access on the entities. Case %#',
    async ({ user, pass }) => {
      const app = setUpApp(routes, (req: Request, _res: Response, next: NextFunction) => {
        (req as any).user = user;
        next();
      });

      await request(app)
        .post(URL)
        .send([
          {
            from: { type: 'entity', entity: 'entity1' },
            to: { type: 'entity', entity: 'entity2' },
            type: factory.id('type1').toHexString(),
          },
        ])
        .expect(pass ? 200 : 401);
    }
  );

  it('should create the relationships', async () => {
    const app = setUpApp(routes, (req: Request, _res: Response, next: NextFunction) => {
      (req as any).user = { _id: factory.id('admin_user'), role: 'admin' };
      next();
    });

    const response = await request(app)
      .post(URL)
      .send([
        {
          from: { type: 'entity', entity: 'entity2' },
          to: { type: 'entity', entity: 'entity1' },
          type: factory.id('type1').toHexString(),
        },
        {
          from: {
            type: 'text',
            entity: 'entity1',
            file: factory.id('file1').toHexString(),
            text: 'some text',
            selections: [
              {
                page: 1,
                top: 1,
                left: 1,
                height: 1,
                width: 1,
              },
              {
                page: 1,
                top: 2,
                left: 2,
                height: 2,
                width: 2,
              },
            ],
          },
          to: { type: 'entity', entity: 'entity2' },
          type: factory.id('type1').toHexString(),
        },
      ]);

    const onDb = await testingDB.mongodb
      ?.collection('relationships')
      .find({ type: factory.id('type1') }, { sort: { 'from.entity': -1 } })
      .toArray();

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject([
      {
        _id: onDb![0]._id.toHexString(),
        from: { entity: 'entity2' },
        to: { entity: 'entity1' },
        type: factory.id('type1').toHexString(),
      },
      {
        _id: onDb![1]._id.toHexString(),
        from: {
          entity: 'entity1',
          file: factory.id('file1').toString(),

          text: 'some text',
          selections: [
            {
              page: 1,
              top: 1,
              left: 1,
              height: 1,
              width: 1,
            },
            {
              page: 1,
              top: 2,
              left: 2,
              height: 2,
              width: 2,
            },
          ],
        },
        to: { entity: 'entity2' },
        type: factory.id('type1').toHexString(),
      },
    ]);

    expect(onDb!.length).toBe(2);
  });
});

describe('DELETE relationships', () => {
  it('should should throw a 404 if the feature toggle is not active', async () => {
    await testingDB.mongodb
      ?.collection('settings')
      .updateOne({ _id: factory.id('settings') }, { $set: { features: {} } });

    const app = setUpApp(routes, (req: Request, _res: Response, next: NextFunction) => {
      (req as any).user = undefined;
      next();
    });

    await request(app)
      .delete(URL)
      .query({ ids: [factory.id('relationship1')] })
      .expect(404);
  });

  const cases = [
    {
      from: { type: 'entity', entity: 'entity1' },
      to: { type: 'entity', entity: 'entity2' },
      type: 'some_type',
    },
    [],
    [{ property: 'non relationship object' }],
    undefined,
  ];

  it.each(cases)(
    'shuold throw a validation error if the input is not an array of strings. Case %#',
    async input => {
      const app = setUpApp(routes, (req: Request, _res: Response, next: NextFunction) => {
        (req as any).user = { _id: factory.id('admin_user'), role: 'admin' };
        next();
      });

      await request(app).delete(URL).query({ ids: input }).expect(422);
    }
  );

  const cases1 = [
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

  it.each(cases1)(
    'should validate the user access on the entities. Case %#',
    async ({ user, pass }) => {
      const app = setUpApp(routes, (req: Request, _res: Response, next: NextFunction) => {
        (req as any).user = user;
        next();
      });

      await request(app)
        .delete(URL)
        .query({
          ids: JSON.stringify([factory.id('relationship1').toHexString()]),
        })
        .expect(pass ? 200 : 401);
    }
  );

  it('should delete the relationship', async () => {
    const app = setUpApp(routes, (req: Request, _res: Response, next: NextFunction) => {
      (req as any).user = { _id: factory.id('admin_user'), role: 'admin' };
      next();
    });

    await request(app)
      .delete(URL)
      .query({ ids: JSON.stringify([factory.id('relationship1').toHexString()]) })
      .expect(200);

    expect(
      (
        await testingDB.mongodb
          ?.collection('relationships')
          .find({ _id: factory.id('relationship1') })
          .toArray()
      )?.length
    ).toBe(0);
  });
});
