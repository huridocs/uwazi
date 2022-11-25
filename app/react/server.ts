import { Application } from 'express';
import { EntryServer } from './entry-server';

export const serverSideRender = (app: Application) => {
  app.get(/^\/(?!api(\/|$)).*$/, EntryServer);
};
