import Router from './ServerRouter.js';

export default app => {
  app.get(/^\/(?!api(\/|$)).*$/, Router);
};
