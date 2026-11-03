import { ConfigModule, ConfigService } from '@nestjs/config';
import { Transport, type RmqOptions } from '@nestjs/microservices';

export const MEDIA_TRANSCODING_CLIENT = Symbol('MEDIA_TRANSCODING_CLIENT');

export const RabbitMQProvider = {
  imports: [ConfigModule],
  inject: [ConfigService],
  name: MEDIA_TRANSCODING_CLIENT,
  useFactory: (configService: ConfigService): RmqOptions => ({
    transport: Transport.RMQ,
    options: {
      urls: [configService.getOrThrow<string>('RABBITMQ_URL')],
      queue: configService.getOrThrow<string>('RABBITMQ_QUEUE_NAME'),
      queueOptions: {
        durable: true,
      },
      persistent: true,
      socketOptions: {
        heartbeatIntervalInSeconds: 60,
        reconnectTimeInSeconds: 5,
      },
    },
  }),
};
