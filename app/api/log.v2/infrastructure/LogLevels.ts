export class LogLevel {
  name: string;

  severity: number;

  constructor(name: string, severity: number) {
    this.name = name;
    this.severity = severity;
  }
}

export const LogLevels: Record<string, LogLevel> = {
  DEBUG: new LogLevel('DEBUG', 10),
  INFO: new LogLevel('INFO', 20),
  WARNING: new LogLevel('WARNING', 30),
  ERROR: new LogLevel('ERROR', 40),
  CRITICAL: new LogLevel('CRITICAL', 50),
};
