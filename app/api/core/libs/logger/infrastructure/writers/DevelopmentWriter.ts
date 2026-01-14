import { inspect } from 'util';
import { LogEntry } from '../LogEntry';
import { LogWriter } from '../LogWriter';

export const DevelopmentWritter: LogWriter = (log: LogEntry) => {
  process.stdout.write(
    `${`[${log.level.name}] - [${log.tenant.name}]:${inspect(log.message)}`}\n${
      log.metadata ? inspect(log.metadata) : ''
    }\n\n`
  );
};
