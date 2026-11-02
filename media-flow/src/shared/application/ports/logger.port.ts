export const APP_LOGGER = Symbol('APP_LOGGER');

export interface LoggerPort {
  log(context: string, message: string): void;
  warn(context: string, message: string): void;
  error(context: string, message: string, error?: unknown): void;
  debug(context: string, message: string): void;
  verbose(context: string, message: string): void;
}
