import { Application } from 'express';
import { runWithStore } from 'shared/atomStore/server.store';
import { EntryServer } from './entry-server';

export const serverSideRender = async (app: Application) => {
  app.get(/^\/(?!api(\/|$)).*$/, async (req, res) => {
    await runWithStore(async () => EntryServer(req, res));
  });
};
