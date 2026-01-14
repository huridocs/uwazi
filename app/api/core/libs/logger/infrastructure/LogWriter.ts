import { LogEntry } from './LogEntry';

export interface LogWriter {
  (log: LogEntry): void;
}
