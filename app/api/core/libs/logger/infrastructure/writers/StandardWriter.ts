import { LogEntry } from '../LogEntry.js';
import { LogWriter } from '../LogWriter.js';

export const StandardWriter: LogWriter = (log: LogEntry) => {
  process.stdout.write(
    `${`${log.timeToString()} - [${log.level.name}] - [${log.tenant.name}]:${log.message}`}\n${log.metadata ? JSON.stringify(log.metadata) : ''}`
  );
};
