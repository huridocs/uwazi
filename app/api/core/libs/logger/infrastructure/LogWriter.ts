import { LogEntry } from '#api/core/libs/logger/infrastructure/LogEntry.js';

export interface LogWriter {
  (log: LogEntry): void;
}
