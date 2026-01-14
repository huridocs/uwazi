import { LogMetadata } from '../infrastructure/LogEntry';

export interface Logger {
  debug(message: string | string[], metadata?: LogMetadata): void;
  info(message: string | string[], metadata?: LogMetadata): void;
  warning(message: string | string[], metadata?: LogMetadata): void;
  error(message: string | string[], metadata?: LogMetadata): void;
  critical(message: string | string[], metadata?: LogMetadata): void;
}
