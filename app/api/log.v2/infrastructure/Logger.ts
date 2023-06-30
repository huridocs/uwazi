/* eslint-disable max-classes-per-file */
import { getTenant } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { Tenant } from 'api/tenants/tenantContext';
import {
  LogEntryInterface,
  LogLevelInterface,
  LoggerInterface,
} from '../contracts/LoggerInterfaces';

class LogLevel implements LogLevelInterface {
  name: string;

  severity: number;

  constructor(name: string, severity: number) {
    this.name = name;
    this.severity = severity;
  }
}

const LogLevels: Record<string, LogLevel> = {
  DEBUG: new LogLevel('DEBUG', 10),
  INFO: new LogLevel('INFO', 20),
  WARNING: new LogLevel('WARNING', 30),
  ERROR: new LogLevel('ERROR', 40),
  CRITICAL: new LogLevel('CRITICAL', 50),
};

class LogEntry implements LogEntryInterface {
  message: string;

  timestamp: number;

  level: LogLevel;

  tenant: Tenant;

  constructor(message: string, timestamp: number, level: LogLevelInterface, tenant: Tenant) {
    this.message = message;
    this.timestamp = timestamp;
    this.level = level;
    this.tenant = tenant;
  }

  private timeToString(): string {
    return new Date(this.timestamp).toISOString();
  }

  toString(): string {
    return `${this.timeToString()} - [${this.level.name}] - [${this.tenant.name}]:${this.message}`;
  }

  toJSONString(): string {
    return JSON.stringify({
      time: this.timeToString(),
      level: this.level.name,
      tenant: this.tenant.name,
      message: this.message,
    });
  }
}

class Logger implements LoggerInterface {
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

const DefaultLogger = () => new Logger(getTenant());

export { Logger, DefaultLogger };
