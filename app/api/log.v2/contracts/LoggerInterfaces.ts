import { Tenant } from 'api/tenants/tenantContext';

export interface LogLevelInterface {
  name: string;
  severity: number;
}

export interface LogEntryInterface {
  message: string;
  timestamp: number;
  level: LogLevelInterface;
  tenant: Tenant;
  toString(): string;
  toJSONString(): string;
}

export interface LoggerInterface {
  debug(message: string | string[], asJSON?: boolean): void;
  info(message: string | string[], asJSON?: boolean): void;
  warning(message: string | string[], asJSON?: boolean): void;
  error(message: string | string[], asJSON?: boolean): void;
  critical(message: string | string[], asJSON?: boolean): void;
}
