import request from 'supertest';

import { DBFixture } from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { setUpApp } from 'api/utils/testingRoutes';
import { UserRole } from 'shared/types/userSchema';
import { UserSchema } from 'shared/types/userType';
import { expectedLinks, linkFixtures, newLinks } from './fixtures';
import settingsRoutes from '../routes';
import settings from '../settings';

let currentUser: UserSchema;

const adminUser = {
  username: 'admin',
  role: UserRole.ADMIN,
  email: 'user@test.com',
};

const editor = {
  username: 'editor',
  role: UserRole.EDITOR,
  email: 'editor@test.com',
};

const collaborator = {
  username: 'collaborator',
  role: UserRole.COLLABORATOR,
  email: 'collab@test.com',
};

function getUser() {
  return currentUser;
}

const app = setUpApp(settingsRoutes, (req, _res, next) => {
  req.user = getUser();
  next();
});

const fixtures: DBFixture = {
  ...linkFixtures,
  users: [adminUser, editor, collaborator],
};

beforeEach(async () => {
  await testingEnvironment.setUp(fixtures);
});

afterAll(async () => testingEnvironment.tearDown());

describe('api/settings/links', () => {
  describe('GET', () => {
    it('should respond with links', async () => {
      const response = await request(app).get('/api/settings/links').expect(200);
      expect(response.body).toEqual(expectedLinks);
    });
  });

  describe('POST', () => {
    it.each([editor, collaborator])('$username should not be able save links', async user => {
      currentUser = user;
      const response = await request(app).post('/api/settings/links');
      expect(response.status).toEqual(401);
      expect(response.body).toEqual({ error: 'Unauthorized', message: 'Unauthorized' });
    });

    it('should overwrite links with new links', async () => {
      currentUser = adminUser;
      const response = await request(app).post('/api/settings/links').send(newLinks);
      expect(response.status).toEqual(200);
      const storedLinks = await settings.getLinks();
      expect(storedLinks).toEqual(newLinks);
    });

    it.each([
      {
        case: 'missing title',
        getInput: () => {
          const { title, ...rest } = newLinks[0];
          return [rest];
        },
        expectedFirstMessage: "must have required property 'title'",
        expectedPath: '/links/0',
      },
      {
        case: 'missing type',
        getInput: () => {
          const { type, ...rest } = newLinks[0];
          return [rest];
        },
        expectedFirstMessage: "must have required property 'type'",
        expectedPath: '/links/0',
      },
      {
        case: 'unexpected type',
        getInput: () => {
          const { type, ...rest } = newLinks[0];
          return [{ ...rest, type: 'unexpected' }];
        },
        expectedFirstMessage: 'must be equal to one of the allowed values',
        expectedPath: '/links/0/type',
      },
      {
        case: 'that links have url',
        getInput: () => {
          const { url, ...rest } = newLinks[0];
          return [{ ...rest }];
        },
        expectedFirstMessage: 'Links of type link should have url',
        expectedPath: '/links/0',
      },
      {
        case: "that groups don't have url",
        getInput: () => [{ ...newLinks[1], url: 'unexpected' }],
        expectedFirstMessage: 'Links of type group should not have url',
        expectedPath: '/links/0',
      },
      {
        case: "that links don't have sublinks",
        getInput: () => [
          {
            ...newLinks[0],
            sublinks: [
              {
                title: 'unexpected',
                url: 'page/unexpectedid/unexpected',
                localId: 'unexpectedLocalId1Id',
              },
            ],
          },
        ],
        expectedFirstMessage: 'Links of type link should not have sublinks',
        expectedPath: '/links/0',
      },
      {
        case: 'that groups have sublinks',
        getInput: () => {
          const { sublinks, ...rest } = newLinks[1];
          return [rest];
        },
        expectedFirstMessage: 'Links of type group should have sublinks',
        expectedPath: '/links/0',
      },
      {
        case: 'missing sublink title',
        getInput: () => {
          const { sublinks, ...rest } = newLinks[1];
          const { title, ...sublink } = sublinks![0];
          return [{ ...rest, sublinks: [{ ...sublink }] }];
        },
        expectedFirstMessage: "must have required property 'title'",
        expectedPath: '/links/0/sublinks/0',
      },
      {
        case: 'missing sublink url',
        getInput: () => {
          const { sublinks, ...rest } = newLinks[1];
          const { url, ...sublink } = sublinks![0];
          return [{ ...rest, sublinks: [{ ...sublink }] }];
        },
        expectedFirstMessage: "must have required property 'url'",
        expectedPath: '/links/0/sublinks/0',
      },
      {
        case: 'missing sublink type',
        getInput: () => {
          const { sublinks, ...rest } = newLinks[1];
          const { type, ...sublink } = sublinks![0];
          return [{ ...rest, sublinks: [{ ...sublink }] }];
        },
        expectedFirstMessage: "must have required property 'type'",
        expectedPath: '/links/0/sublinks/0',
      },
      {
        case: 'unexpected sublink type',
        getInput: () => {
          const { sublinks, ...rest } = newLinks[1];
          const { type, ...sublink } = sublinks![0];
          return [{ ...rest, sublinks: [{ ...sublink, type: 'unexpected' }] }];
        },
        expectedFirstMessage: 'must be equal to one of the allowed values',
        expectedPath: '/links/0/sublinks/0/type',
      },
    ])('should validate $case', async ({ getInput, expectedFirstMessage, expectedPath }) => {
      currentUser = adminUser;
      const input = getInput();
      const response = await request(app).post('/api/settings/links').send(input);
      expect(response.body.validations[0].message).toEqual(expectedFirstMessage);
      expect(response.body.validations[0].instancePath).toEqual(expectedPath);
      expect(response.status).toEqual(422);
    });
  });
});
