import { tenants } from './index';
import elasticMapping from '../../../database/elastic_mapping/elastic_mapping';

const getTenantESMapping = () => {
  const tenantElasticMapping = {
    settings: { ...elasticMapping.settings },
    mappings: { ...elasticMapping.mappings },
  };

  tenantElasticMapping.settings['index.number_of_replicas'] =
    tenants.current().featureFlags?.esReplicas || 0;

  return tenantElasticMapping;
};

export { getTenantESMapping };
