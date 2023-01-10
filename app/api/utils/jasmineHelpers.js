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

const conformValidationErrors = (routeCanFail, expected) =>
  routeCanFail
    ? `Route is not correctly authorized for ['${expected.join("', '")}']`
    : 'Route is not authorized ! (Auth middleware should be the first one)';

const conformMessage = (result, routeCanFail, expected) =>
  result.pass ? 'route is authorized' : conformValidationErrors(routeCanFail, expected);

const matchers = {
  toNeedAuthorization(routeResult, expected) {
    const routeCanFail = assessStatus(routeResult) === 401;
    const routeValidatesExpected = expected ? assessAuthorized(routeResult, expected) : true;
    const result = { pass: routeCanFail && routeValidatesExpected };
    result.message = () => conformMessage(result, routeCanFail, expected);
    return result;
  },
};

expect.extend(matchers);

export function catchErrors(done) {
  return error => {
    if (error instanceof Error) {
      return done.fail(error);
    }
    return done.fail(JSON.stringify(error));
  };
}
