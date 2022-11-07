import { Application } from 'express';
import request from 'supertest';

import { setUpApp } from 'api/utils/testingRoutes';
import { testingDB } from 'api/utils/testing_db';
import { UserInContextMockFactory } from 'api/utils/testingUserInContext';

import { searchRoutes } from '../routes';
import { permissionsLevelFixtures, users } from './permissionsFiltersFixtures';

describe('entities GET permissions + published filter', () => {
  const app: Application = setUpApp(searchRoutes);
  const userFactory = new UserInContextMockFactory();

  beforeAll(async () => {
    await testingDB.setupFixturesAndContext(permissionsLevelFixtures, 'entities.v2.permissions');
  });

  afterAll(async () => testingDB.disconnect());

  describe('GET/public entities', () => {
    describe('when user is not logged in', () => {
      it('should only see published entities', async () => {
        userFactory.mock(undefined);
        const { body } = await request(app).get('/api/v2/search').expect(200);

        expect(body.data).toEqual([
          expect.objectContaining({ title: 'entPublic1' }),
          expect.objectContaining({ title: 'entPublic2' }),
        ]);
      });
    });

    describe('when user is collaborator', () => {
      it('should see public and authorized entities', async () => {
        userFactory.mock(users.user2);

        const { body } = await request(app).get('/api/v2/search');

        expect(body.data).toEqual([
          expect.objectContaining({ title: 'ent3' }),
          expect.objectContaining({ title: 'ent4' }),
          expect.objectContaining({ title: 'entPublic1' }),
          expect.objectContaining({ title: 'entPublic2' }),
        ]);
      });
    });

    describe('when user is editor or admin', () => {
      it.each`
        user
        ${users.adminUser}
        ${users.editorUser}
      `('should see all entities ($user.role)', async ({ user }) => {
        userFactory.mock(user);

        const { body } = await request(app).get('/api/v2/search');

        expect(body.data).toEqual([
          expect.objectContaining({ title: 'ent1' }),
          expect.objectContaining({ title: 'ent2' }),
          expect.objectContaining({ title: 'ent3' }),
          expect.objectContaining({ title: 'ent4' }),
          expect.objectContaining({ title: 'entPublic1' }),
          expect.objectContaining({ title: 'entPublic2' }),
        ]);
      });
    });

    describe('when filtering published: true', () => {
      it.each`
        user
        ${users.user1}
        ${users.editorUser}
        ${users.adminUser}
      `('should only see published entities ($user.role)', async ({ user }) => {
        userFactory.mock(user);
        const query = { filter: { published: true } };

        const { body } = await request(app).get('/api/v2/search').query(query);

        expect(body.data).toEqual([
          expect.objectContaining({ title: 'entPublic1' }),
          expect.objectContaining({ title: 'entPublic2' }),
        ]);
      });
    });

    describe('when filtering published: false', () => {
      describe('non logged in users', () => {
        it('should not return any results', async () => {
          userFactory.mock(undefined);
          const { body } = await request(app)
            .get('/api/v2/search')
            .query({ filter: { published: false } })
            .expect(200);

          expect(body.data).toEqual([]);
        });
      });

      describe('when user is collaborator', () => {
        it('should only see authorized entities', async () => {
          userFactory.mock(users.user2);

          const { body } = await request(app)
            .get('/api/v2/search')
            .query({ filter: { published: false } });

          expect(body.data).toEqual([
            expect.objectContaining({ title: 'ent3' }),
            expect.objectContaining({ title: 'ent4' }),
          ]);
        });
      });

      describe('when user is admin/editor', () => {
        it.each`
          user
          ${users.adminUser}
          ${users.editorUser}
        `('should see only published: false entities ($user.role)', async ({ user }) => {
          userFactory.mock(user);

          const { body } = await request(app)
            .get('/api/v2/search')
            .query({ filter: { published: false } });

          expect(body.data).toEqual([
            expect.objectContaining({ title: 'ent1' }),
            expect.objectContaining({ title: 'ent2' }),
            expect.objectContaining({ title: 'ent3' }),
            expect.objectContaining({ title: 'ent4' }),
          ]);
        });
      });
    });
  });
});
