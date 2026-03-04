import { Tenant } from '#api/tenants/tenantContext.js';
import { LogLevel } from './LogLevels.js';

export type LogMetadata = {
  /**
   * Flag to trigger external notifications through the logging infrastructure.
   *
   * When set to `true`, this log entry should be forwarded to configured external
   * notification systems (e.g., chat platforms, incident management tools) to alert
   * the team of important events requiring immediate attention.
   *
   * @default undefined (no notification)
   */
  notify?: boolean;

  [key: string]: any;
};

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
