import '#api/utils/jasmineHelpers.js';
import instrumentRoutes from '#api/utils/instrumentRoutes.js';
import * as usersUtils from '#api/auth2fa/usersUtils.js';

import auth2faRoutes from '../routes.js';

// POST /api/auth2fa-secret and POST /api/auth2fa-enable have been migrated to the
// v2 architecture and are covered by ./GenerateTwoFactorSecret.spec.ts and
// ./EnableTwoFactorAuth.spec.ts instead.
describe('Auth2fa Routes', () => {
  let routes;
  let req;
  const success = { success: true };
  const incorrectUser = new Error('Incorrect user passed');

  beforeEach(() => {
    routes = instrumentRoutes(auth2faRoutes);
    jest.spyOn(usersUtils, 'reset2fa').mockImplementation(() => {});
  });

  const validateAuthorizationAndValidation = (path, roles) => {
    expect(routes._post(path, req)).toNeedAuthorization(roles);
    expect(routes.post.validation(path)).toMatchSnapshot();
  };

  const reset2faMock = passedUser =>
    passedUser._id === 'userId' ? Promise.resolve(success) : Promise.reject(incorrectUser);

  const expectResponseToMatch = async (util, url, mock) => {
    usersUtils[util].mockImplementation(mock);
    const response = await routes.post(url, req);
    expect(response).toMatchSnapshot();
  };

  const expectNextWithError = async (util, url) => {
    const expectedError = new Error('Error passed by usersUtils');
    usersUtils[util].mockImplementation(() => Promise.reject(expectedError));

    const next = jest.fn();
    try {
      await routes.post(url, req, {}, next);
      fail('Should call next');
    } catch (err) {
      expect(next).toHaveBeenCalledWith(expectedError);
    }
  };

  const validateRoute = async (util, url, mock, roles) => {
    validateAuthorizationAndValidation(url, roles);
    await expectResponseToMatch(util, url, mock);
    expectNextWithError(util, url);
  };

  describe('auth2fa-reset', () => {
    beforeEach(() => {
      req = { body: { _id: 'userId' } };
    });

    it('should conform the route with auth, validation, respond correctly and call next on error', async () => {
      await validateRoute('reset2fa', '/api/auth2fa-reset', reset2faMock, ['admin']);
    });
  });
});
