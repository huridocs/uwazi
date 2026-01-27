import { Application } from 'express';
import { EntryServer } from '#app/entry-server.js';

export const serverSideRender = (app: Application) => {
  app.get(/^\/(?!api(\/|$)).*$/, EntryServer);
};
