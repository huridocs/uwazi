import { config } from '#api/config.js';
import { LogEntry } from '../LogEntry.js';
import { LogWriter } from '../LogWriter.js';

export const toStandardJSONLine = (log: LogEntry) =>
  `${JSON.stringify({
    timestamp: log.timeToString(),
    level: log.level.name,
    tenant: log.tenant.name,
    correlation_id: log.correlationId,
    process_id: process.pid,
    message: log.message,
    ...log.metadata,
    environment: config.ENVIRONMENT,
    application_name: 'Uwazi',
  })}\n`;

export const StandardJSONWriter: LogWriter = (log: LogEntry) => {
  process.stdout.write(toStandardJSONLine(log));
};
