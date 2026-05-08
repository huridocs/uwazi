import { Client } from '@elastic/elasticsearch';
import { TransactionManagerFactory } from '../factories/TransactionManagerFactory.js';
import { getSharedConnection } from '../mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTenantRoutingDataSource } from './MongoTenantRoutingDataSource.js';
import { TenantAwareESClient } from './TenantAwareESClient.js';
import { IndexNameResolver } from './IndexNameResolver.js';
import { config } from '#api/config.js';
import { AuthorizedEntityESClient } from './entities/AuthorizedElasticEntityClient.js';
import { User } from '#api/users.v2/model/User.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';

class ElasticSearchClientFactory {
  private static instance: Client;

  static getInstance(): Client {
    if (!ElasticSearchClientFactory.instance) {
      ElasticSearchClientFactory.instance = new Client({
        nodes: config.elasticSearchMultiTenant.nodes,
        requestTimeout: config.elasticSearchMultiTenant.requestTimeout,
        auth: config.elasticSearchMultiTenant.auth,
      });
    }

    return ElasticSearchClientFactory.instance;
  }

  static tenantAware(): TenantAwareESClient {
    const mongoTenantRoutingDataSource = new MongoTenantRoutingDataSource(
      getSharedConnection(),
      TransactionManagerFactory.createForSharedDataBase()
    );

    const resolver = new IndexNameResolver(mongoTenantRoutingDataSource);

    const client = ElasticSearchClientFactory.getInstance();

    return new TenantAwareESClient({
      client,
      resolver,
      tenantId: ExecutionContext.tenant.name,
    });
  }

  static authorizedEntityClient(): AuthorizedEntityESClient {
    const mongoTenantRoutingDataSource = new MongoTenantRoutingDataSource(
      getSharedConnection(),
      TransactionManagerFactory.createForSharedDataBase()
    );

    const resolver = new IndexNameResolver(mongoTenantRoutingDataSource);

    const elasticClient = new TenantAwareESClient({
      client: ElasticSearchClientFactory.getInstance(),
      resolver,
      tenantId: ExecutionContext.tenant.name,
    });

    return new AuthorizedEntityESClient({
      actor: ExecutionContext.actor || User.createFrom(null),
      elasticClient,
    });
  }
}

export { ElasticSearchClientFactory };
