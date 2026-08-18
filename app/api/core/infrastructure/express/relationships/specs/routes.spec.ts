import type { Application, NextFunction, Request, Response } from 'express';
import request from 'supertest';

import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { setUpApp } from '#api/utils/testingRoutes.js';
import { UserRole } from '#shared/types/userSchema.js';
import {
  enRect1,
  enRect2,
  id,
  relationshipQueryFixtures,
} from '#api/core/application/specs/relationshipQueryFixtures.js';
import { relationshipsQueryRoutes } from '../routes.js';

type Actor = {
  _id: string;
  role: 'admin' | 'editor' | 'collaborator';
  username: string;
  email: string;
};

const actor = (key: string, role: Actor['role']): Actor => ({
  _id: id(key).toString(),
  role,
  username: key,
  email: `${key}@test.com`,
});

const admin = actor('admin', UserRole.ADMIN);
const editor = actor('editor', UserRole.EDITOR);
const collaborator = actor('collab', UserRole.COLLABORATOR);
const sourceEn = id('source-en').toString();

const appFor = (user?: Actor): Application =>
  setUpApp(relationshipsQueryRoutes, (req: Request, _res: Response, next: NextFunction) => {
    if (user) {
      req.user = user;
    }
    next();
  });

const get = (app: Application, path: string, query: Record<string, string> = {}) =>
  request(app).get(path).query(query);

describe('GET /api/relationships/summary|anchors|resolved', () => {
  const adminApp = appFor(admin);
  const editorApp = appFor(editor);
  const collabApp = appFor(collaborator);
  const anonApp = appFor();

  beforeAll(async () => {
    await testingEnvironment.setUp(relationshipQueryFixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('ACL', () => {
    it('includes unpublished connected entities for admin', async () => {
      const response = await get(adminApp, '/api/relationships/summary', { sharedId: 'source' });
      expect(response).toHaveStatus(200);
      expect(response.body.rows.map((row: { entity: string }) => row.entity)).toContain('secret');
    });

    it('lets editors read unpublished sources', async () => {
      const response = await get(editorApp, '/api/relationships/summary', { sharedId: 'hidden' });
      expect(response).toHaveStatus(200);
      expect(response.body.rows).toHaveLength(2);
    });

    it('lets a collaborator read an unpublished source they can access', async () => {
      const response = await get(collabApp, '/api/relationships/summary', {
        sharedId: 'collabdoc',
      });
      expect(response).toHaveStatus(200);
      expect(response.body.rows).toHaveLength(2);
    });

    it('omits unpublished connected entities for anonymous users', async () => {
      const response = await get(anonApp, '/api/relationships/summary', { sharedId: 'source' });
      expect(response).toHaveStatus(200);
      expect(response.body.rows.map((row: { entity: string }) => row.entity)).not.toContain(
        'secret'
      );
    });
  });

  describe('HTTP contract', () => {
    it.each([
      [collabApp, '/api/relationships/summary', { sharedId: 'hidden' }],
      [collabApp, '/api/relationships/anchors', { sharedId: 'hidden', file: sourceEn }],
      [collabApp, '/api/relationships/resolved', { sharedId: 'hidden' }],
      [anonApp, '/api/relationships/summary', { sharedId: 'hidden' }],
      [adminApp, '/api/relationships/summary', { sharedId: 'missing' }],
      [adminApp, '/api/relationships/anchors', { sharedId: 'missing', file: sourceEn }],
      [adminApp, '/api/relationships/resolved', { sharedId: 'missing' }],
    ])(
      'returns 404 { rows: [] } when the source is unreadable or missing',
      async (app, path, query) => {
        const response = await get(app, path, query);
        expect(response).toHaveStatus(404);
        expect(response.body).toEqual({ rows: [] });
      }
    );

    it('returns 200 { rows: [] } when the graph is empty', async () => {
      const response = await get(adminApp, '/api/relationships/summary', { sharedId: 'orphan' });
      expect(response).toHaveStatus(200);
      expect(response.body).toEqual({ rows: [] });
    });

    it('uses Accept-Language for entity titles', async () => {
      const response = await request(adminApp)
        .get('/api/relationships/summary')
        .set('Accept-Language', 'es')
        .query({ sharedId: 'source' });
      expect(response).toHaveStatus(200);
      expect(response.body.rows).toContainEqual(
        expect.objectContaining({ entityData: expect.objectContaining({ title: 'Source ES' }) })
      );
    });

    it.each([
      ['/api/relationships/summary', {}],
      ['/api/relationships/anchors', { sharedId: 'source' }],
    ])('returns 422 when a required query param is missing (%s)', async (path, query) => {
      const response = await get(adminApp, path, query);
      expect(response).toHaveStatus(422);
    });

    it('maps anchors and resolved through the HTTP layer', async () => {
      const anchors = await get(adminApp, '/api/relationships/anchors', {
        sharedId: 'source',
        file: sourceEn,
      });
      expect(anchors).toHaveStatus(200);
      expect(anchors.body.rows).toEqual([
        { _id: id('hubMain-source-en').toString(), reference: { selectionRectangles: [enRect1] } },
      ]);

      const resolved = await get(adminApp, '/api/relationships/resolved', { sharedId: 'source' });
      expect(resolved).toHaveStatus(200);
      expect(resolved.body.rows).toContainEqual({
        _id: id('hubMain-source-en').toString(),
        reference: { text: 'en quote', selectionRectangles: [enRect1, enRect2] },
      });
    });
  });
});
