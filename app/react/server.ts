import type { Application } from 'express';
import { runWithStore } from '#shared/atomStore/server.store.js';
import { EntryServer } from './entry-server.js';

export const serverSideRender = async (app: Application) => {
  app.get(/^\/(?!api(\/|$)).*$/, async (req, res) => {
    await runWithStore(async () => EntryServer(req, res));
  });
};
