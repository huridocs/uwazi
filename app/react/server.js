import { EntryServer } from './entry-server';

export default app => {
  app.get(/^\/(?!api(\/|$)).*$/, EntryServer);
};
