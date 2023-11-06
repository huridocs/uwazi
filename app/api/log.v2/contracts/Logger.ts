export interface Logger {
  debug(message: string | string[]): void;
  info(message: string | string[]): void;
  warning(message: string | string[]): void;
  error(message: string | string[]): void;
  critical(message: string | string[]): void;
}
