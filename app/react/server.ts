import type { Application } from 'express';
import { EntryServer } from './entry-server.js';

export const serverSideRender = (app: Application) => {
  app.get(/^\/(?!api(\/|$)).*$/, EntryServer);
};
