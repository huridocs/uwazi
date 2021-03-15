import winston from 'winston';

import { tenants } from 'api/tenants';
import { config } from 'api/config';

const addTenant = winston.format((info, { instanceName }: { instanceName: string }) => {
  let tenantName = instanceName;
  if (info.shouldBeMultiTenantContext) {
    const tenant = tenants.current();
    tenantName = tenant.name === config.defaultTenant.name ? instanceName : tenant.name;
  }
  return { ...info, tenant: tenantName };
});

const formatInfo = (info: any) => {
  const message = info.message && info.message.join ? info.message.join('\n') : info.message;
  return `${info.timestamp} [${info.tenant}] ${message}`;
};

const formatter = (DATABASE_NAME: String) =>
  winston.format.combine(
    winston.format.timestamp(),
    addTenant({ instanceName: DATABASE_NAME }),
    winston.format.printf(info => formatInfo(info))
  );

export { formatter };
