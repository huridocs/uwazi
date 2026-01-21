import { Tenant } from '#api/tenants/tenantContext.js';
import { LogLevel } from '#api/core/libs/logger/infrastructure/LogLevels.js';
import { tenants } from '#api/tenants/index.js';

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
