import { Client } from '@elastic/elasticsearch';
import { TransactionManagerFactory } from '../factories/TransactionManagerFactory';
import { getSharedConnection } from '../mongodb/common/getConnectionForCurrentTenant';
import { MongoTenantRoutingRepository } from './MongoTenantRoutingRepository';
import { TenantAwareESClient } from './TenantAwareESClient';
import { TenantIndexResolver } from './TenantIndexResolver';
import { config } from '#api/config.js';

class ElasticSearchClientFactory {
  private static instance: Client;

  static tenantAware(tenantId: string): TenantAwareESClient {
    const mongoTenantRoutingRepository = new MongoTenantRoutingRepository(
      getSharedConnection(),
      TransactionManagerFactory.createForSharedDataBase()
    );

    const tenantIndexResolver = new TenantIndexResolver(mongoTenantRoutingRepository);

    return new TenantAwareESClient({
      client: ElasticSearchClientFactory.getInstance(),
      resolver: tenantIndexResolver,
      tenantId,
    });
  }

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
}

export { ElasticSearchClientFactory };
