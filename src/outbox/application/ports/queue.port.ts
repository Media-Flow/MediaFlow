export const QUEUE = Symbol('QUEUE');

export interface TranscodeOutBoxMessage {
  MediaId: string;
  SourceKey: string;
  EventId: string;
}

export interface QueuePort {
  push(message: TranscodeOutBoxMessage): Promise<void>;
}
