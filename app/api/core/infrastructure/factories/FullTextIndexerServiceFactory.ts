import { tenants } from '#api/tenants/index.js';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { FullTextIndexerService } from '../elasticSearch/entities/FullTextIndexerService.js';
import { MongoEntityDAO } from '../mongodb/entity/MongoEntityDAO.js';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant.js';
import { permissionsContext } from '#api/permissions/permissionsContext.js';
import { User } from '#api/users.v2/model/User.js';

export class FullTextIndexerServiceFactory {
  static default(): FullTextIndexerService {
    const tenant = tenants.current();

    if (!tenant.featureFlags?.v2ElasticSearch || process.env.NODE_ENV === 'test') {
      return TestUtils.mockClass<FullTextIndexerService>({
        deleteByFilenames: async () => Promise.resolve(),
        index: async () => Promise.resolve(),
      });
    }

    const user = permissionsContext.getUserInContext() || null;

    const db = getConnection();
    const esClient = ExecutionContext.elasticClient;
    const entityDAO = new MongoEntityDAO(
      db,
      ExecutionContext.transactionManager,
      User.createFrom(user)
    );

    const fullTextIndexer = new FullTextIndexerService({ esClient, entityDAO });

    return fullTextIndexer;
  }
}
