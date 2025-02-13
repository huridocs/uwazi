import { tenants } from './index';
import elasticMapping from '../../../database/elastic_mapping/elastic_mapping';

const getTenantESMapping = () => {
  const tenantElasticMapping = {
    settings: { ...elasticMapping.settings },
    mappings: { ...elasticMapping.mappings },
  };

  if (tenants.current().featureFlags?.esUseReplicas) {
    tenantElasticMapping.settings['index.number_of_replicas'] = 1;
  }

  return tenantElasticMapping;
};

export { getTenantESMapping };
