import { config } from '#api/config.js';
import { LogEntry } from '#api/core/libs/logger/infrastructure/LogEntry.js';
import { LogWriter } from '#api/core/libs/logger/infrastructure/LogWriter.js';

export const StandardJSONWriter: LogWriter = (log: LogEntry) => {
  process.stdout.write(
    `${JSON.stringify({
      timestamp: log.timeToString(),
      level: log.level.name,
      tenant: log.tenant.name,
      process_id: process.pid,
      message: log.message,
      ...log.metadata,
      environment: config.ENVIRONMENT,
      application_name: 'Uwazi',
    })}\n`
  );
};
