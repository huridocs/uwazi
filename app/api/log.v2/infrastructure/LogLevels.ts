export class LogLevel {
  name: string;

  severity: number;

  constructor(name: string, severity: number) {
    this.name = name;
    this.severity = severity;
  }
}

export const LogLevels: Record<string, LogLevel> = {
  DEBUG: new LogLevel('debug', 10),
  INFO: new LogLevel('info', 20),
  WARNING: new LogLevel('warning', 30),
  ERROR: new LogLevel('error', 40),
  CRITICAL: new LogLevel('critical', 50),
};
