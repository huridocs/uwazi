import { ObjectId } from 'mongodb';
import request from 'supertest';

import { DBFixture } from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { setUpApp } from '#api/utils/testingRoutes.js';
import { UserRole } from '#shared/types/userSchema.js';
import { UserSchema } from '#shared/types/userType.js';
import {
  expectedLinks,
  linkFixtures,
  newLinks,
} from '../../../../application/settings/specs/fixtures.js';
import { settingsRoutes } from '../routes.js';
import { SettingsQueryServiceFactory } from '#api/core/infrastructure/factories/SettingsQueryServiceFactory.js';

let currentUser: UserSchema;

const adminUser = {
  _id: new ObjectId(),
  username: 'admin',
  role: UserRole.ADMIN,
  email: 'user@test.com',
};

const editor = {
  _id: new ObjectId(),
  username: 'editor',
  role: UserRole.EDITOR,
  email: 'editor@test.com',
};

const collaborator = {
  _id: new ObjectId(),
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
      const storedLinks =
        (
          await testingEnvironment.runWithContext(async () =>
            SettingsQueryServiceFactory.default().getPublic()
          )
        ).links || [];
      expect(storedLinks).toEqual(
        newLinks.map(link =>
          link.sublinks?.length
            ? {
                ...link,
                sublinks: link.sublinks.map(sublink => ({
                  ...sublink,
                  _id: expect.anything(),
                })),
              }
            : link
        )
      );
    });

    it.each([
      {
        case: 'missing title',
        getInput: () => {
          const { title, ...rest } = newLinks[0];
          return [rest];
        },
        expectedFirstMessage: 'Required',
        expectedPath: 'links.0.title',
      },
      {
        case: 'missing type',
        getInput: () => {
          const { type, ...rest } = newLinks[0];
          return [rest];
        },
        expectedFirstMessage: 'Required',
        expectedPath: 'links.0.type',
      },
      {
        case: 'unexpected type',
        getInput: () => {
          const { type, ...rest } = newLinks[0];
          return [{ ...rest, type: 'unexpected' }];
        },
        expectedFirstMessage:
          "Invalid enum value. Expected 'link' | 'group', received 'unexpected'",
        expectedPath: 'links.0.type',
      },
      {
        case: 'that links have url',
        getInput: () => {
          const { url, ...rest } = newLinks[0];
          return [{ ...rest }];
        },
        expectedFirstMessage: 'Links of type link should have url',
        expectedPath: 'links.0',
      },
      {
        case: "that groups don't have url",
        getInput: () => [{ ...newLinks[1], url: 'unexpected' }],
        expectedFirstMessage: 'Links of type group should not have url',
        expectedPath: 'links.0',
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
                type: 'link',
                localId: 'unexpectedLocalId1Id',
              },
            ],
          },
        ],
        expectedFirstMessage: 'Links of type link should not have sublinks',
        expectedPath: 'links.0',
      },
      {
        case: 'that groups have sublinks',
        getInput: () => {
          const { sublinks, ...rest } = newLinks[1];
          return [rest];
        },
        expectedFirstMessage: 'Links of type group should have sublinks',
        expectedPath: 'links.0',
      },
      {
        case: 'missing sublink title',
        getInput: () => {
          const { sublinks, ...rest } = newLinks[1];
          const { title, ...sublink } = sublinks![0];
          return [{ ...rest, sublinks: [{ ...sublink }] }];
        },
        expectedFirstMessage: 'Required',
        expectedPath: 'links.0.sublinks.0.title',
      },
      {
        case: 'missing sublink url',
        getInput: () => {
          const { sublinks, ...rest } = newLinks[1];
          const { url, ...sublink } = sublinks![0];
          return [{ ...rest, sublinks: [{ ...sublink }] }];
        },
        expectedFirstMessage: 'Required',
        expectedPath: 'links.0.sublinks.0.url',
      },
      {
        case: 'missing sublink type',
        getInput: () => {
          const { sublinks, ...rest } = newLinks[1];
          const { type, ...sublink } = sublinks![0];
          return [{ ...rest, sublinks: [{ ...sublink }] }];
        },
        expectedFirstMessage: 'Invalid literal value, expected "link"',
        expectedPath: 'links.0.sublinks.0.type',
      },
      {
        case: 'unexpected sublink type',
        getInput: () => {
          const { sublinks, ...rest } = newLinks[1];
          const { type, ...sublink } = sublinks![0];
          return [{ ...rest, sublinks: [{ ...sublink, type: 'unexpected' }] }];
        },
        expectedFirstMessage: 'Invalid literal value, expected "link"',
        expectedPath: 'links.0.sublinks.0.type',
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
