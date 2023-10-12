import { Tenant } from 'api/tenants/tenantContext';
import { LogLevel } from './LogLevels';

export class LogEntry {
  message: string;

  timestamp: number;

  level: LogLevel;

  tenant: Tenant;

  constructor(message: string, timestamp: number, level: LogLevel, tenant: Tenant) {
    this.message = message;
    this.timestamp = timestamp;
    this.level = level;
    this.tenant = tenant;
  }

  timeToString(): string {
    return new Date(this.timestamp).toISOString();
  }
}
