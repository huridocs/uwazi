import { inspect } from 'util';
import { LogEntry } from '../LogEntry.js';
import { LogWriter } from '../LogWriter.js';

export const DevelopmentWritter: LogWriter = (log: LogEntry) => {
  const correlation = log.correlationId ? ` - [${log.correlationId}]` : '';
  process.stdout.write(
    `${`[${log.level.name}] - [${log.tenant.name}]${correlation}:${inspect(log.message)}`}\n${
      log.metadata ? inspect(log.metadata) : ''
    }`
  );
};
