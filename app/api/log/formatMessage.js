import { tenants } from 'api/tenants';
import { config } from 'api/config';

export default function formatMessage(info, instanceName) {
  const message = info.message && info.message.join ? info.message.join('\n') : info.message;

  const tenant = tenants.current();
  let tenantName = tenant.name;

  if (tenantName === config.defaultTenant.name) {
    tenantName = instanceName;
  }

  const result = `${info.timestamp} [${tenantName}] ${message}`;

  return result;
}
