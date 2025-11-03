import { Tenant } from 'api/tenants/tenantContext';
import { Logger } from '../contracts/Logger';
import { LogEntry, LogMetadata } from './LogEntry';
import { LogLevel, LogLevels } from './LogLevels';
import { LogWriter } from './LogWriter';

class StandardLogger implements Logger {
  private write: LogWriter;

  private tenant: Tenant;

  constructor(writer: LogWriter, tenant: Tenant) {
    this.write = writer;
    this.tenant = tenant;
  }

  private log(level: LogLevel, _message: string | string[], metadata?: LogMetadata): void {
    const message = Array.isArray(_message) ? _message.join('\n') : _message;
    const entry = new LogEntry(message, Date.now(), level, this.tenant, metadata);

    this.write(entry);
  }

  debug(message: string | string[], metadata?: LogMetadata): void {
    this.log(LogLevels.DEBUG, message, metadata);
  }

  info(message: string | string[], metadata?: LogMetadata): void {
    this.log(LogLevels.INFO, message, metadata);
  }

  warning(message: string | string[], metadata?: LogMetadata): void {
    this.log(LogLevels.WARNING, message, metadata);
  }

  error(message: string | string[], metadata?: LogMetadata): void {
    this.log(LogLevels.ERROR, message, metadata);
  }

  critical(message: string | string[], metadata?: LogMetadata): void {
    this.log(LogLevels.CRITICAL, message, metadata);
  }
}

export const withFeature =
  (writer: LogWriter, featureName: string): LogWriter =>
  (log: LogEntry) => {
    writer(
      new LogEntry(log.message, log.timestamp, log.level, log.tenant, {
        ...log.metadata,
        feature: featureName,
      })
    );
  };

export { StandardLogger };
