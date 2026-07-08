import { LogEntry } from '../LogEntry.js';
import { LogWriter } from '../LogWriter.js';

const COLORS = {
  INFO: '\x1b[32m',
  WARNING: '\x1b[33m',
  ERROR: '\x1b[31m',
  CRITICAL: '\x1b[31m',
  DEBUG: '\x1b[36m',
  RESET: '\x1b[0m',
};

const formatMetadata = (metadata: Record<string, unknown> | undefined): string => {
  if (!metadata || Object.keys(metadata).length === 0) {
    return '';
  }

  const parts = Object.entries(metadata)
    .filter(([key, value]) => key !== 'namespace' && value !== undefined)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}=[${value.join(', ')}]`;
      }
      return `${key}=${value}`;
    });

  if (parts.length === 0) {
    return '';
  }

  return ` (${parts.join(', ')})`;
};

export const MigrationHumanReadableWriter: LogWriter = (log: LogEntry) => {
  const level = log.level.name.toUpperCase();
  const color = COLORS[level] || '';
  const metadata = formatMetadata(log.metadata);

  process.stdout.write(`${color}[${level}]${COLORS.RESET} ${log.message}${metadata}\n`);
};
