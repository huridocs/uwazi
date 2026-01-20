import { LogEntry } from '#api/core/libs/logger/infrastructure/LogEntry.js';
import { LogWriter } from '#api/core/libs/logger/infrastructure/LogWriter.js';

export const StandardWriter: LogWriter = (log: LogEntry) => {
  process.stdout.write(
    `${`${log.timeToString()} - [${log.level.name}] - [${log.tenant.name}]:${log.message}`}\n${log.metadata ? JSON.stringify(log.metadata) : ''}`
  );
};
