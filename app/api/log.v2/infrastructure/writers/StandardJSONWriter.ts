import { LogEntry } from '../LogEntry';
import { LogWriter } from '../LogWriter';

export const StandardJSONWriter: LogWriter = (log: LogEntry) => {
  process.stdout.write(
    `${JSON.stringify({
      time: log.timeToString(),
      level: log.level.name,
      tenant: log.tenant.name,
      pid: process.pid,
      message: log.message,
      ...log.metadata,
      application_name: 'Uwazi',
    })}\n`
  );
};
