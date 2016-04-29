import auth from '../auth/authMiddleware';

let matchers = {
  toNeedAuthorization() {
    return {
      compare(routeResult) {
        var result = { pass: routeResult.middlewares.indexOf(auth) !== -1};
        if(result.pass) {
          result.message =  "route is authorized";
        } else {
          result.message =  "Route is not authorized !";
        }
        return result;
      }
    }
  }
}

beforeEach(() => {
  jasmine.addMatchers(matchers);
});
