import { tenants } from 'api/tenants';
import { config } from 'api/config';

const addTenant = (info: any, { instanceName }: { instanceName: string }) => {
  let tenantName = instanceName;
  let tenantError;

  try {
    const tenant = tenants.current();
    tenantName = tenant.name === config.defaultTenant.name ? instanceName : tenant.name;
  } catch (err) {
    tenantError = err;
  }

  return { ...info, tenant: tenantName, tenantError };
};

const formatInfo = (info: any) => {
  const message = info.message && info.message.join ? info.message.join('\n') : info.message;
  return `${info.timestamp} [${info.tenant}] ${message}${info.tenantError ? `\n[Tenant error] ${info.tenantError}` : ''}`;
};

const jsonFormatter = (info: { [k: string]: string }) =>
  JSON.stringify({
    application_name: 'Uwazi',
    level: info.level,
    timestamp: info.timestamp,
    environment: config.ENVIRONMENT,
    tenant: info.tenant,
    message: formatInfo(info),
    tenantError: info.tenantError,
  });

const formatter = ({ DATABASE_NAME, message, level }: { [k: string]: string }) => {
  let info = { message, timestamp: new Date(Date.now()).toISOString(), level };
  info = addTenant(info, { instanceName: DATABASE_NAME });

  if (config.JSON_LOGS) {
    return jsonFormatter(info);
  }

  return formatInfo(info);
};

export { formatter, addTenant, formatInfo };
