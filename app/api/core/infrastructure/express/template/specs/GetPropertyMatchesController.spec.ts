import type { Application, NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { setUpApp } from '#api/utils/testingRoutes.js';
import type { DBFixture } from '#api/utils/testing_db.js';
import { UserRole } from '#shared/types/userSchema.js';
import type { GetPropertyMatchesResponse } from '#shared/contracts/Template.js';
import templateRoutes from '../routes.js';

const f = getFixturesFactory();

const fixtures: DBFixture = {
  settings: [{ languages: [{ key: 'en', label: 'English', default: true }] }],
  templates: [
    f.template('Cases', [
      f.property('t_est', 'text', { _id: f.id('Cases-t_est'), label: 'T!est' }),
      f.property('victims', 'relationship', {
        _id: f.id('Cases-victims'),
        label: 'victims',
        relationType: f.idString('victim of'),
        content: f.idString('People'),
        inherit: { property: f.idString('People-nationality'), type: 'text' },
      }),
    ]),
  ],
};

const admin = { _id: 'admin', role: UserRole.ADMIN, username: 'admin' };
let currentUser: Request['user'] | undefined = admin;

const app: Application = setUpApp(
  templateRoutes,
  (req: Request, _res: Response, next: NextFunction) => {
    if (currentUser) {
      req.user = currentUser;
    }
    next();
  }
);

const URL = '/api/templates/properties/matches';

describe('GET /api/templates/properties/matches', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterEach(() => {
    currentUser = admin;
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should return the derived name and the conflicting matches', async () => {
    const response = await request(app).get(URL).query({ label: 'T?est', type: 'numeric' });

    expect(response).toHaveStatus(200);
    const expected: GetPropertyMatchesResponse = {
      name: 't_est',
      matches: [
        {
          templateId: f.idString('Cases'),
          templateName: 'Cases',
          propertyId: f.idString('Cases-t_est'),
          label: 'T!est',
          type: 'text',
          conflicts: ['type'],
        },
      ],
    };
    expect(response.body).toEqual(expected);
  });

  it('should compare inherited types when both inherit parameters are sent', async () => {
    const response = await request(app)
      .get(URL)
      .query({
        label: 'Victims',
        type: 'relationship',
        relationType: f.idString('victim of'),
        content: f.idString('People'),
        inheritProperty: f.idString('People-nationality'),
        inheritType: 'date',
      });

    expect(response).toHaveStatus(200);
    expect(response.body.matches.map((m: { conflicts: string[] }) => m.conflicts)).toEqual([
      ['inheritType'],
    ]);
  });

  it.each([
    { reason: 'label is missing', query: { type: 'text' } },
    { reason: 'label is empty', query: { label: '', type: 'text' } },
    { reason: 'type is invalid', query: { label: 'A', type: 'not-a-type' } },
    { reason: 'a relationship has no relationType', query: { label: 'A', type: 'relationship' } },
  ])('should reject the request when $reason', async ({ query }) => {
    const response = await request(app).get(URL).query(query);

    expect(response).toHaveStatus(422);
  });

  it.each([
    { role: 'anonymous', user: undefined },
    { role: 'editor', user: { _id: 'editor', role: UserRole.EDITOR, username: 'editor' } },
    {
      role: 'collaborator',
      user: { _id: 'collaborator', role: UserRole.COLLABORATOR, username: 'collaborator' },
    },
  ])('should reject $role users', async ({ user }) => {
    currentUser = user;

    const response = await request(app).get(URL).query({ label: 'T?est', type: 'text' });

    expect(response).toHaveStatus(401);
    expect(response.body).toEqual({ error: 'Unauthorized', message: 'Unauthorized' });
  });
});
