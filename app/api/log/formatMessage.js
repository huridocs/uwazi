import { tenants } from 'api/tenants';
import { config } from 'api/config';

export default function formatMessage(info, instanceName) {
  const message = info.message && info.message.join ? info.message.join('\n') : info.message;

  let tenantName = instanceName;
  if (info.shouldBeMultiTenantContext) {
    const tenant = tenants.current();
    tenantName = tenant.name === config.defaultTenant.name ? instanceName : tenant.name;
  }

  return `${info.timestamp} [${tenantName}] ${message}`;
}
