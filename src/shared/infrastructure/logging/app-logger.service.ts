import { Injectable, Logger } from '@nestjs/common';
import type { LoggerPort } from '../../application/ports/logger.port';

@Injectable()
export class AppLogger implements LoggerPort {
  private readonly loggers = new Map<string, Logger>();

  log(context: string, message: string): void {
    this.getLogger(context).log(message);
  }

  warn(context: string, message: string): void {
    this.getLogger(context).warn(message);
  }

  error(context: string, message: string, error?: unknown): void {
    const stack =
      error instanceof Error
        ? error.stack
        : error === undefined
          ? undefined
          : String(error);

    this.getLogger(context).error(message, stack);
  }

  debug(context: string, message: string): void {
    this.getLogger(context).debug(message);
  }

  verbose(context: string, message: string): void {
    this.getLogger(context).verbose(message);
  }

  private getLogger(context: string): Logger {
    let logger = this.loggers.get(context);
    if (!logger) {
      logger = new Logger(context);
      this.loggers.set(context, logger);
    }
    return logger;
  }
}
