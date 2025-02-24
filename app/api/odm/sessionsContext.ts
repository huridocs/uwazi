import { ClientSession } from 'mongoose';
import { Readable } from 'stream';

import { tenants } from 'api/tenants';
import { appContext } from 'api/utils/AppContext';

import { DB } from './DB';
import { FileTypes } from 'api/files/storage';

export const dbSessionContext = {
  getSession() {
    return appContext.get('mongoSession') as ClientSession | undefined;
  },

  getReindexOperations() {
    return (
      (appContext.get('reindexOperations') as [query?: any, select?: string, limit?: number][]) ||
      []
    );
  },

  getFileOperations() {
    return (
      (appContext.get('fileOperations') as {
        filename: string;
        file: Readable;
        type: FileTypes;
      }[]) || []
    );
  },

  clearSession() {
    appContext.set('mongoSession', undefined);
  },

  clearContext() {
    appContext.set('mongoSession', undefined);
    appContext.set('reindexOperations', undefined);
    appContext.set('fileOperations', undefined);
  },

  async startSession() {
    const currentTenant = tenants.current();
    const session = DB.connectionForDB(currentTenant.dbName).getClient().startSession();
    appContext.set('mongoSession', session);
    return session;
  },

  registerESIndexOperation(args: [query?: any, select?: string, limit?: number]) {
    const reindexOperations = dbSessionContext.getReindexOperations();
    reindexOperations.push(args);
    appContext.set('reindexOperations', reindexOperations);
  },

  registerFileOperation(args: { filename: string; file: Readable; type: FileTypes }) {
    const fileOperations = dbSessionContext.getFileOperations();
    fileOperations.push(args);
    appContext.set('fileOperations', fileOperations);
  },
};
