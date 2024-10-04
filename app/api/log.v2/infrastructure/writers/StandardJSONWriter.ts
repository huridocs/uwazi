import { LogEntry } from '../LogEntry';
import { LogWriter } from '../LogWriter';

export const StandardJSONWriter: LogWriter = (log: LogEntry) => {
  process.stdout.write(
    `${JSON.stringify({
      time: log.timeToString(),
      level: log.level.name,
      tenant: log.tenant.name,
      message: log.message,
    })}\n`
  );
};

export const UwaziJSONWriter: LogWriter = (log: LogEntry) => {
  process.stdout.write(
    `${JSON.stringify({
      time: log.timeToString(),
      level: log.level.name,
      tenant: log.tenant.name,
      message: log.message,
      application_name: 'Uwazi',
    })}\n`
  );
};
