import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoEntityDAO } from '#api/core/infrastructure/mongodb/entity/MongoEntityDAO.js';
import { User } from '#api/users.v2/model/User.js';
import { tenants } from '#api/tenants/index.js';
import { DefaultDispatcher } from '#api/core/libs/queue/configuration/factories.js';
import { CloneLanguageEntitiesJob } from '../jobs/CloneLanguageEntitiesJob.js';

class CloneLanguageEntitiesJobFactory {
  static default(): CloneLanguageEntitiesJob {
    const transactionManager = TransactionManagerFactory.default();
    const db = getConnection();
    const entityDAO = new MongoEntityDAO(db, transactionManager, User.createFrom(null));
    const filesCollection = db.collection('files');
    const jobsDispatcher = DefaultDispatcher(tenants.current().name, transactionManager);
    return new CloneLanguageEntitiesJob({ entityDAO, filesCollection, jobsDispatcher });
  }
}

export { CloneLanguageEntitiesJobFactory };
