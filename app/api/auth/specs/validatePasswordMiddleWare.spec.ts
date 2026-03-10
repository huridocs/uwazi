import { Request, NextFunction, Response } from 'express';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { UserSchema } from 'shared/types/userType';
import { UserRole } from 'shared/types/userSchema';
import { encryptPassword } from '../encryptPassword';
import { validatePasswordMiddleWare } from '../validatePasswordMiddleWare';

const fixturesFactory = getFixturesFactory();

describe('validatePasswordMiddleWare', () => {
  const mockResponse = (): Response => {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as Response;
  };

  const res = mockResponse();
  const users: UserSchema[] = [];
  const next: NextFunction = jest.fn();

  const createRequest = (request: Partial<Request>): Request =>
    <Request>{
      ...request,
      user: request.user,
      body: request.body,
      headers: request.headers,
    };

  const gernerateFixtures = async () => {
    users.push(
      ...[
        {
          ...fixturesFactory.user(
            'admin',
            UserRole.ADMIN,
            'admin@test.com',
            await encryptPassword('admin1234')
          ),
        },
        {
          ...fixturesFactory.user(
            'editor',
            UserRole.EDITOR,
            'editor@test.com',
            await encryptPassword('editor1234')
          ),
        },
      ]
    );

    return {
      users,
    };
  };

  beforeAll(async () => {
    const fixtures = await gernerateFixtures();
    await testingEnvironment.setUp(fixtures);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should reject when the password is incorrect', async () => {
    const request = createRequest({
      user: { _id: users[0]._id, username: users[0].username, role: users[0].role },
      body: { username: 'a_new_user', role: 'collaborator', email: 'collaborator@huridocs.org' },
      headers: { authorization: 'Basic wrongPass' },
    });

    await validatePasswordMiddleWare(request, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Forbidden', error: 'Password error' });
  });

  it('should reject when the password is empty', async () => {
    const emptyPasswordRequest = createRequest({
      user: { _id: users[0]._id, username: users[0].username, role: users[0].role },
      body: { username: 'a_new_user', role: 'collaborator', email: 'collaborator@huridocs.org' },
      headers: { authorization: 'Basic ' },
    });

    const noAuthHeaderRequest = createRequest({
      user: { _id: users[0]._id, username: users[0].username, role: users[0].role },
      body: { _id: users[0]._id, username: users[0].username, role: users[0].role },
      headers: { cookie: 'some cookie' },
    });

    await validatePasswordMiddleWare(emptyPasswordRequest, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenNthCalledWith(1, { message: 'Forbidden', error: 'Password error' });

    await validatePasswordMiddleWare(noAuthHeaderRequest, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenNthCalledWith(2, { message: 'Forbidden', error: 'Password error' });
  });

  it('should succeed when the passwords match', async () => {
    const request = createRequest({
      user: { _id: users[1]._id, username: users[1].username, role: users[1].role },
      body: { _id: users[1]._id, username: users[1].username, role: users[1].role },
      headers: { authorization: 'Basic editor1234' },
    });

    await validatePasswordMiddleWare(request, res, next);

    expect(next).toHaveBeenCalled();
  });
});
