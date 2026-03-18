import { Client } from '@elastic/elasticsearch';
import { TransactionManagerFactory } from '../factories/TransactionManagerFactory';
import { getSharedConnection } from '../mongodb/common/getConnectionForCurrentTenant';
import { MongoTenantRoutingDataSource } from './MongoTenantRoutingDataSource';
import { TenantAwareESClient } from './TenantAwareESClient';
import { IndexNameResolver } from './IndexNameResolver';
import { config } from '#api/config.js';
import { UserSchema } from '#shared/types/userType.js';
import { AuthorizedEntityESClient } from './entities/AuthorizedElasticEntityClient';

class ElasticSearchClientFactory {
  private static instance: Client;

  static getInstance(): Client {
    if (!ElasticSearchClientFactory.instance) {
      ElasticSearchClientFactory.instance = new Client({
        nodes: config.elasticsearch.nodes,
        requestTimeout: config.elasticsearch.requestTimeout,
        auth: config.elasticsearch.auth,
      });
    }

    return ElasticSearchClientFactory.instance;
  }

  static tenantAware(tenantId: string): TenantAwareESClient {
    const mongoTenantRoutingDataSource = new MongoTenantRoutingDataSource(
      getSharedConnection(),
      TransactionManagerFactory.createForSharedDataBase()
    );

    const resolver = new IndexNameResolver(mongoTenantRoutingDataSource);

    const client = ElasticSearchClientFactory.getInstance();

    return new TenantAwareESClient({
      client,
      resolver,
      tenantId,
    });
  }

  static authorizedEntityClient(
    tenantId: string,
    actor: UserSchema | null
  ): AuthorizedEntityESClient {
    const mongoTenantRoutingDataSource = new MongoTenantRoutingDataSource(
      getSharedConnection(),
      TransactionManagerFactory.createForSharedDataBase()
    );

    const resolver = new IndexNameResolver(mongoTenantRoutingDataSource);

    const elasticClient = new TenantAwareESClient({
      client: ElasticSearchClientFactory.getInstance(),
      resolver,
      tenantId,
    });

    return new AuthorizedEntityESClient({
      actor,
      elasticClient,
    });
  }
}

export { ElasticSearchClientFactory };
