import { getTenant } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { Tenant } from 'api/tenants/tenantContext';
import { Logger } from '../contracts/Logger';
import { LogLevel, LogLevels } from './LogLevels';
import { LogEntry } from './LogEntry';

class StandardLogger implements Logger {
  private tenant: Tenant;

  constructor(tenant: Tenant) {
    this.tenant = tenant;
  }

  private log(level: LogLevel, _message: string | string[], asJSON: boolean = false): void {
    const message = Array.isArray(_message) ? _message.join('\n') : _message;
    const entry = new LogEntry(message, Date.now(), level, this.tenant);
    if (asJSON) {
      process.stdout.write(`${entry.toJSONString()}\n`);
    } else {
      process.stdout.write(`${entry.toString()}\n`);
    }
  }

  debug(message: string | string[], asJSON: boolean = false): void {
    this.log(LogLevels.DEBUG, message, asJSON);
  }

  info(message: string | string[], asJSON: boolean = false): void {
    this.log(LogLevels.INFO, message, asJSON);
  }

  warning(message: string | string[], asJSON: boolean = false): void {
    this.log(LogLevels.WARNING, message, asJSON);
  }

  error(message: string | string[], asJSON: boolean = false): void {
    this.log(LogLevels.ERROR, message, asJSON);
  }

  critical(message: string | string[], asJSON: boolean = false): void {
    this.log(LogLevels.CRITICAL, message, asJSON);
  }
}

const DefaultLogger = () => new StandardLogger(getTenant());

export { StandardLogger, DefaultLogger };
