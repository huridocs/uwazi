import { getTenant } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { Tenant } from 'api/tenants/tenantContext';
import { Logger } from '../contracts/Logger';
import { LogLevel, LogLevels } from './LogLevels';
import { LogEntry } from './LogEntry';
import { LogWriter } from './LogWriter';
import { StandardJSONWriter } from './writers/StandardJSONWriter';

class StandardLogger implements Logger {
  private write: LogWriter;

  private tenant: Tenant;

  constructor(writer: LogWriter, tenant: Tenant) {
    this.write = writer;
    this.tenant = tenant;
  }

  private log(level: LogLevel, _message: string | string[]): void {
    const message = Array.isArray(_message) ? _message.join('\n') : _message;
    const entry = new LogEntry(message, Date.now(), level, this.tenant);

    this.write(entry);
  }

  debug(message: string | string[]): void {
    this.log(LogLevels.DEBUG, message);
  }

  info(message: string | string[]): void {
    this.log(LogLevels.INFO, message);
  }

  warning(message: string | string[]): void {
    this.log(LogLevels.WARNING, message);
  }

  error(message: string | string[]): void {
    this.log(LogLevels.ERROR, message);
  }

  critical(message: string | string[]): void {
    this.log(LogLevels.CRITICAL, message);
  }
}

const DefaultLogger = () => new StandardLogger(StandardJSONWriter, getTenant());

export { StandardLogger, DefaultLogger };
