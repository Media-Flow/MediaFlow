import { TranscodeOutboxStatus } from './transcode-outbox-status';

export interface EventProps {
  id: string;
  mediaId: string;
  payload: Record<string, string>;
  status: TranscodeOutboxStatus;
  retries: number;
  createdAt: Date; //When Event Record Created
  publishedAt: Date | null;
  failedAt: Date | null;
  lastError: string | null;
}

export class Event {
  private constructor(private readonly props: EventProps) {}

  static create(params: {
    id: string;
    mediaId: string;
    payload: Record<string, string>;
    now?: Date;
  }): Event {
    return new Event({
      id: params.id,
      mediaId: params.mediaId,
      payload: params.payload,
      status: TranscodeOutboxStatus.PENDING,
      retries: 0,
      createdAt: params.now ?? new Date(),
      publishedAt: null,
      failedAt: null,
      lastError: null,
    });
  }

  static reconstitute(props: EventProps): Event {
    return new Event(props);
  }

  markPublished(publishedAt = new Date()): void {
    this.props.status = TranscodeOutboxStatus.PUBLISHED;
    this.props.publishedAt = publishedAt;
    this.props.failedAt = null;
    this.props.lastError = null;
  }

  markFailed(error: string, failedAt = new Date()): void {
    this.props.status = TranscodeOutboxStatus.FAILED;
    this.props.retries += 1;
    this.props.failedAt = failedAt;
    this.props.lastError = error;
  }

  get id(): string {
    return this.props.id;
  }

  get mediaId(): string {
    return this.props.mediaId;
  }

  get payload(): Record<string, string> {
    return this.props.payload;
  }

  get status(): TranscodeOutboxStatus {
    return this.props.status;
  }

  get retries(): number {
    return this.props.retries;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get publishedAt(): Date | null {
    return this.props.publishedAt;
  }

  get failedAt(): Date | null {
    return this.props.failedAt;
  }

  get lastError(): string | null {
    return this.props.lastError;
  }
}
