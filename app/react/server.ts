import { Application } from 'express';
import { EntryServer } from '#app/entry-server.jsx';

export const serverSideRender = (app: Application) => {
  app.get(/^\/(?!api(\/|$)).*$/, EntryServer);
};
