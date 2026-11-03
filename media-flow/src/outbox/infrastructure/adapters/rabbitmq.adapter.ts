import { Inject, Injectable } from '@nestjs/common';
import {
  QueuePort,
  TranscodeOutBoxMessage,
} from '../../application/ports/queue.port';
import { MEDIA_TRANSCODING_CLIENT } from '../../../shared/infrastructure/queue/rabbitmq.provider';
import { ClientProxy } from '@nestjs/microservices';
import {
  APP_LOGGER,
  type LoggerPort,
} from '../../../shared/application/ports/logger.port';

@Injectable()
export class RabbitMQAdapter implements QueuePort {
  private readonly context = RabbitMQAdapter.name;

  constructor(
    @Inject(MEDIA_TRANSCODING_CLIENT)
    private readonly queueClient: ClientProxy,
    @Inject(APP_LOGGER) private readonly logger: LoggerPort,
  ) {}

  push(message: TranscodeOutBoxMessage): Promise<void> {
    const eventId = message.EventId;

    this.logger.log(
      this.context,
      `Publishing transcode event ${eventId} for media ${message.MediaId}`,
    );

    return new Promise<void>((resolve, reject) => {
      try {
        this.queueClient.emit('media.transcode', message).subscribe({
          error: (error: unknown) => {
            this.logger.error(
              this.context,
              `RabbitMQ reported a publish failure for transcode event ${eventId}, media ${message.MediaId}`,
              error,
            );
            reject(error);
          },
          complete: () => {
            this.logger.log(
              this.context,
              `Published transcode event ${eventId} for media ${message.MediaId}`,
            );
            resolve();
          },
        });
      } catch (error) {
        this.logger.error(
          this.context,
          `Could not initiate the RabbitMQ publish for transcode event ${eventId}, media ${message.MediaId}`,
          error,
        );
        reject(error);
      }
    });
  }
}
