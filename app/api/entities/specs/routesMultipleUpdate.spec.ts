import { Application, NextFunction, Request, Response } from 'express';
import request from 'supertest';

import { testingEnvironment } from '#api/utils/testingEnvironment';
import { setUpApp } from '#api/utils/testingRoutes';
import routes from '#api/entities/routes';
import { testingTenants } from '#api/utils/testingTenants';
import { UserInContextMockFactory } from '#api/utils/testingUserInContext';
import { UserRole } from '#shared/types/userSchema.js';
import db from '#api/utils/testing_db';
import { fixtures, factory } from '#api/core/application/specs/MultiUpdateEntityFixtures';
import { EventEmitterFactory } from '#api/core/libs/eventEmitter/EventEmitterFactory.js';

jest.mock(
  '../../auth/authMiddleware.ts',
  () => () => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  }
);

const adminUser = {
  _id: db.id(),
  role: UserRole.ADMIN,
  username: 'admin',
  email: 'admin@test.com',
};

const userInContext = new UserInContextMockFactory();

let app: Application;

const multipleUpdate = async (
  body: object,
  options: { language?: string; expectStatus?: number } = {}
) => {
  const response = await request(app)
    .post('/api/entities/multipleupdate')
    .set('Accept-Language', options.language ?? 'en')
    .send(body);

  if (options.expectStatus !== undefined) {
    expect(response.status).toBe(options.expectStatus);
  } else {
    expect(response.status).toBe(200);
  }

  return response.body;
};

beforeAll(async () => {
  testingTenants.mockCurrentTenant({ name: 'default' });
  await testingEnvironment.setUp(fixtures);
  jest.spyOn(EventEmitterFactory, 'default').mockReturnValue(EventEmitterFactory.forTesting());
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe.each([
  {
    title: 'POST /api/entities/multipleupdate - V1',
    featureFlags: { v2MultipleUpdateEntity: false },
  },
  {
    title: 'POST /api/entities/multipleupdate - V2',
    featureFlags: { v2MultipleUpdateEntity: true },
  },
])('$title', ({ featureFlags }) => {
  beforeEach(async () => {
    app = setUpApp(routes, (req: Request, _res: Response, next: NextFunction) => {
      (req as any).user = adminUser;
      next();
    });

    await testingEnvironment.setUp(fixtures);
    testingTenants.changeCurrentTenant({ featureFlags });
    userInContext.mock(adminUser);
  });

  afterEach(() => {
    userInContext.restore();
  });

  describe('metadata update', () => {
    it('should update metadata on the selected entities and return them in the target language', async () => {
      const body = {
        ids: ['entity-1', 'entity-2'],
        values: {
          metadata: {
            numeric: [{ value: 99 }],
          },
        },
      };

      const result = await multipleUpdate(body, { language: 'en' });

      expect(result).toHaveLength(2);

      const e1 = result.find((e: any) => e.sharedId === 'entity-1');
      const e2 = result.find((e: any) => e.sharedId === 'entity-2');

      expect(e1).toMatchObject({
        sharedId: 'entity-1',
        language: 'en',
        metadata: expect.objectContaining({ numeric: [{ value: 99 }] }),
      });
      expect(e2).toMatchObject({
        sharedId: 'entity-2',
        language: 'en',
        metadata: expect.objectContaining({ numeric: [{ value: 99 }] }),
      });
    });

    it('should return entities in the requested language', async () => {
      const body = {
        ids: ['entity-1'],
        values: {
          metadata: {
            numeric: [{ value: 55 }],
          },
        },
      };

      const result = await multipleUpdate(body, { language: 'es' });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        sharedId: 'entity-1',
        language: 'es',
        metadata: expect.objectContaining({ numeric: [{ value: 55 }] }),
      });
    });
  });

  describe('template change', () => {
    it('should change the template on selected entities', async () => {
      const basicTemplateId = factory.id('Basic Template').toHexString();

      const body = {
        ids: ['entity-1'],
        values: {
          template: basicTemplateId,
        },
      };

      const result = await multipleUpdate(body, { language: 'en' });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        sharedId: 'entity-1',
        language: 'en',
        template: expect.anything(),
      });
      expect(result[0].template.toString()).toBe(basicTemplateId);
    });
  });

  describe('empty ids', () => {
    it('should return an empty array when no ids are provided (V1 only)', async () => {
      if (featureFlags.v2MultipleUpdateEntity) return;
      const body = {
        ids: [],
        values: { metadata: { numeric: [{ value: 1 }] } },
      };

      const result = await multipleUpdate(body);
      expect(result).toEqual([]);
    });
  });
});

describe('POST /api/entities/multipleupdate - V2 only behaviours', () => {
  beforeEach(async () => {
    app = setUpApp(routes, (req: Request, _res: Response, next: NextFunction) => {
      (req as any).user = adminUser;
      next();
    });

    await testingEnvironment.setUp(fixtures);
    testingTenants.changeCurrentTenant({ featureFlags: { v2MultipleUpdateEntity: true } });
    userInContext.mock(adminUser);
  });

  afterEach(() => {
    userInContext.restore();
  });

  it('should not change icon or published even if passed in values', async () => {
    const body = {
      ids: ['entity-1'],
      values: {
        metadata: { numeric: [{ value: 77 }] },
        icon: { _id: 'new-icon', type: 'image', label: 'New Icon' },
        published: true,
      },
    };

    const result = await multipleUpdate(body, { language: 'en' });

    expect(result).toHaveLength(1);
    // icon should remain unchanged from fixture
    expect(result[0].icon).toMatchObject({ _id: 'icon-original-1' });
    // published should remain false as set in fixture
    expect(result[0].published).toBe(false);
  });

  it('should return 422 when ids is empty', async () => {
    await multipleUpdate(
      { ids: [], values: { metadata: { numeric: [{ value: 1 }] } } },
      { expectStatus: 422 }
    );
  });

  it('should return 422 when ids exceeds 1000 entries', async () => {
    await multipleUpdate(
      { ids: Array.from({ length: 1001 }, (_, i) => `id-${i}`), values: {} },
      { expectStatus: 422 }
    );
  });
});
