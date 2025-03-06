import { Tenant } from 'api/tenants/tenantContext';
import { LogLevel } from './LogLevels';

export type LogMetadata = Record<string, any>;

export class LogEntry {
  message: string;

  timestamp: number;

  level: LogLevel;

  tenant: Tenant;

  metadata: LogMetadata | undefined;

  constructor(
    message: string,
    timestamp: number,
    level: LogLevel,
    tenant: Tenant,
    metadata?: LogMetadata
  ) {
    this.message = message;
    this.timestamp = timestamp;
    this.level = level;
    this.tenant = tenant;
    this.metadata = metadata;
  }

  timeToString(): string {
    return new Date(this.timestamp).toISOString();
  }
}
