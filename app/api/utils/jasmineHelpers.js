import auth from '../auth/authMiddleware';

export function catchErrors(done) {
  return (error) => {
    if (error instanceof Error) {
      return done.fail(error.stack);
    }
    done.fail(JSON.stringify(error));
  };
}

let matchers = {
  toNeedAuthorization() {
    return {
      compare(routeResult) {
        let result = {pass: routeResult.middlewares.indexOf(auth) !== -1};
        if (result.pass) {
          result.message = 'route is authorized';
        } else {
          result.message = 'Route is not authorized !';
        }
        return result;
      }
    };
  }
};

beforeEach(() => {
  jasmine.addMatchers(matchers);
});
