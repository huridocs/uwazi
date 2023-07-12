export interface Logger {
  debug(message: string | string[], asJSON?: boolean): void;
  info(message: string | string[], asJSON?: boolean): void;
  warning(message: string | string[], asJSON?: boolean): void;
  error(message: string | string[], asJSON?: boolean): void;
  critical(message: string | string[], asJSON?: boolean): void;
}
