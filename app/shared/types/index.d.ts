export {};

declare global {
  namespace jest {
    interface Matchers<R> {
      toNeedAuthorization(): R;
    }
  }

  namespace Express {
    interface Request {
      user: import('api/users/usersModel').User;
      language: string;
    }
  }
}
