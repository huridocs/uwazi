import { Application, NextFunction, Request, Response } from 'express';
import { setUpApp } from 'api/utils/testingRoutes';
import userGroupRoutes from 'api/usergroups/routes';
import request, { Response as SuperTestResponse } from 'supertest';
import userGroups from '../userGroups';

jest.mock(
  '../../utils/languageMiddleware.ts',
  () => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  }
);

describe('usergroups routes', () => {
  let user: { username: string; role: string } | undefined;
  function getUser() {
    return user;
  }
  const app: Application = setUpApp(
    userGroupRoutes,
    (req: Request, _res: Response, next: NextFunction) => {
      (req as any).user = getUser();
      next();
    }
  );

  describe('GET', () => {
    async function getUserGroups() {
      const response: SuperTestResponse = await request(app)
        .get('/api/usergroups')
        .set('X-Requested-With', 'XMLHttpRequest');
      return response;
    }
    const groups = [{ name: 'group1' }];
    beforeEach(() => {
      spyOn(userGroups, 'get').and.returnValue(Promise.resolve(groups));
    });
    it('should query and return an array of existing user groups', async () => {
      user = { username: 'user 1', role: 'admin' };
      const response = await getUserGroups();
      expect(response.body).toEqual(groups);
    });

    it('should reject with unauthorized when user has not admin role', async () => {
      user = { username: 'user 1', role: 'editor' };
      const response = await getUserGroups();
      expect(response.unauthorized).toBe(true);
    });

    it('should reject with unauthorized when there is no user', async () => {
      user = undefined;
      const response = await getUserGroups();
      expect(response.unauthorized).toBe(true);
    });
  });

  describe('POST', () => {
    const defaultUserGroup: any = { _id: 'group1', name: 'group 1', members: [] };
    async function postUserGroup(userGroupData = defaultUserGroup) {
      return request(app)
        .post('/api/usergroups')
        .set('X-Requested-With', 'XMLHttpRequest')
        .send(userGroupData);
    }

    beforeEach(() => {
      const userGroup = { _id: 'group1', name: 'group 1' };
      spyOn(userGroups, 'save').and.returnValue(Promise.resolve(userGroup));
    });

    it('should save a user group and return the updated data', async () => {
      user = { username: 'user 1', role: 'admin' };
      const response = await postUserGroup();
      expect(response.body._id).toEqual('group1');
    });

    describe('authorization', () => {
      it('should reject with unauthorized when user has not admin role', async () => {
        user = { username: 'user 1', role: 'editor' };
        const response = await postUserGroup();
        expect(response.unauthorized).toBe(true);
      });

      it('should reject with unauthorized when there is no user', async () => {
        user = undefined;
        const response = await postUserGroup();
        expect(response.unauthorized).toBe(true);
      });
    });

    describe('validation', () => {
      it('should return a validation error if user group data is not valid', async () => {
        user = { username: 'user 1', role: 'admin' };
        const response = await postUserGroup({ name: undefined });
        expect(response.status).toBe(400);
        expect(response.body.errors[0].keyword).toBe('required');
        expect(response.body.errors[0].dataPath).toBe('.body');
        expect(response.body.error).toBe('validation failed');
      });

      it('should validate a user group that has an invalid user id', async () => {
        user = { username: 'user 1', role: 'admin' };
        const response = await postUserGroup({ name: 'group 1', members: [{ _id: undefined }] });
        expect(response.status).toBe(400);
        expect(response.body.errors[0].keyword).toBe('required');
        expect(response.body.errors[0].dataPath).toBe('.body.members[0]');
        expect(response.body.error).toBe('validation failed');
      });

      it('should not validate an object with additional properties', async () => {
        user = { username: 'user 1', role: 'admin' };
        const response = await postUserGroup({
          name: 'group 1',
          other: 'invalid',
          members: [{ _id: 'user1', other: 'invalid1' }],
        });
        expect(response.status).toBe(400);
        expect(response.body.errors[0].keyword).toBe('additionalProperties');
        expect(response.body.errors[0].dataPath).toBe('.body');
        expect(response.body.errors[1].keyword).toBe('additionalProperties');
        expect(response.body.errors[1].dataPath).toBe('.body.members[0]');
        expect(response.body.error).toBe('validation failed');
      });
    });
  });
});
