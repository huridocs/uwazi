/** @format */

const assessStatus = routeResult => {
  let status;
  const req = {};
  const next = () => {};
  const res = {
    status: code => {
      status = code;
    },
    json: () => {},
  };

  routeResult.middlewares[0](req, res, next);

  return status;
};

const assessAuthorized = (routeResult, roles = []) => {
  const nextCalledFor = [];

  roles.forEach(role => {
    const req = {
      user: { role },
      get: key => (key === 'X-Requested-With' ? 'XMLHttpRequest' : ''),
    };
    const res = { status: () => {}, json: () => {} };
    const next = () => {
      nextCalledFor.push(role);
    };
    routeResult.middlewares[0](req, res, next);
  });

  return roles.join(',') === nextCalledFor.join(',');
};

export function catchErrors(done) {
  return error => {
    if (error instanceof Error) {
      return done.fail(error.stack);
    }
    return done.fail(JSON.stringify(error));
  };
}

const matchers = {
  toNeedAuthorization() {
    return {
      compare(routeResult, expected) {
        let routeValidatesExpected = true;
        const routeCanFail = assessStatus(routeResult) === 401;

        if (expected) {
          routeValidatesExpected = assessAuthorized(routeResult, expected);
        }

        const result = { pass: routeCanFail && routeValidatesExpected };
        if (result.pass) {
          result.message = () => 'route is authorized';
        } else {
          result.message = () =>
            routeCanFail
              ? `Route is not correctly authorized for ['${expected.join("', '")}']`
              : 'Route is not authorized ! (Auth middleware should be the first one)';
        }
        return result;
      },
    };
  },
  containItems() {
    return {
      compare(actual, expected) {
        const result = {};
        const missingItems = expected.filter(item => !actual.includes(item));
        result.pass = !missingItems.length && actual.length === expected.length;
        if (result.pass) {
          result.message = 'Collections are equal';
        } else {
          result.message = `Expected: [${expected}] but got: [${actual}]`;
        }
        return result;
      },
    };
  },
  toContainEqual: jasmine.matchers ? jasmine.matchers.toContain : () => {},
};

beforeEach(() => {
  jasmine.addMatchers(matchers);
});
