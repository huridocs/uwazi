import { ClientSession } from 'mongoose';
import { Readable } from 'stream';

import { appContext } from 'api/utils/AppContext';
import { FileTypes } from 'api/files/storage';
import { MongoTransactionManager } from 'api/core/infrastructure/mongodb/common/MongoTransactionManager';

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
    appContext.set('transactionManager', undefined);
    appContext.set('mongoSession', undefined);
  },

  clearContext() {
    appContext.set('mongoSession', undefined);
    appContext.set('reindexOperations', undefined);
    appContext.set('fileOperations', undefined);
    appContext.set('transactionManager', undefined);
  },

  getTransactionManager() {
    return appContext.get('transactionManager') as MongoTransactionManager | undefined;
  },

  setTransactionManager(transactionManager: MongoTransactionManager) {
    appContext.set('mongoSession', transactionManager.getSession());
    appContext.set('transactionManager', transactionManager);
  },

  setSession(session: ClientSession) {
    appContext.set('mongoSession', session);
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
