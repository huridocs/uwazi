import { inspect } from 'util';
import { LogEntry } from '#api/core/libs/logger/infrastructure/LogEntry.js';
import { LogWriter } from '#api/core/libs/logger/infrastructure/LogWriter.js';

export const DevelopmentWritter: LogWriter = (log: LogEntry) => {
  process.stdout.write(
    `${`[${log.level.name}] - [${log.tenant.name}]:${inspect(log.message)}`}\n${
      log.metadata ? inspect(log.metadata) : ''
    }\n\n`
  );
};
