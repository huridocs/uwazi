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
