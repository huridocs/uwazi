import { LogEntry } from './LogEntry.js';

export interface LogWriter {
  (log: LogEntry): void;
}
