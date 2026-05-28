import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { User } from '#api/users.v2/model/User.js';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant.js';
import { MongoEntitiesDAO } from '../mongodb/entity/MongoEntitiesDAO.js';

export class MongoEntitiesDAOFactory {
  static default(): MongoEntitiesDAO {
    return new MongoEntitiesDAO(
      getConnection(),
      ExecutionContext.transactionManager,
      ExecutionContext.actor || User.createFrom(null)
    );
  }
}
