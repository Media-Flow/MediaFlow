import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import {
  EVENT_REPOSITORY,
  type EventRepositoryPort,
} from '../ports/event.repository.port';
import { Event } from '../../domain/event.entity';

@Injectable()
export class AddEvent {
  constructor(
    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: EventRepositoryPort,
  ) {}

  async execute(input: { mediaId: string; sourceKey: string }): Promise<void> {
    const id = randomUUID();
    const createdAt = new Date();

    const event = Event.create({
      id,
      mediaId: input.mediaId,
      payload: {
        MediaId: input.mediaId,
        SourceKey: input.sourceKey,
        EventId: id,
      },
      now: createdAt,
    });

    await this.eventRepository.save(event);
  }
}
