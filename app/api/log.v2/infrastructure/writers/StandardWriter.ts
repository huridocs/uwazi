import { LogEntry } from '../LogEntry';
import { LogWriter } from '../LogWriter';

export const StandardWriter: LogWriter = (log: LogEntry) => {
  process.stdout.write(
    `${`${log.timeToString()} - [${log.level.name}] - [${log.tenant.name}]:${log.message}`}\n`
  );
};
