import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { RabbitMQProvider } from './rabbitmq.provider';
@Module({
    imports: [
        ClientsModule.registerAsync([RabbitMQProvider])
    ],
    exports: [ClientsModule],
})
export class MessageQueueModule {

}