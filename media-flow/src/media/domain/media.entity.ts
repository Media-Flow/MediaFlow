import { MediaStatus, MediaType } from './constants';

export interface CreateMediaParams {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  type: MediaType;
  totalParts: number;
  size: number;
  isPrivate?: boolean;
}

export interface MediaProps {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  type: MediaType;
  uploadId: string | null;
  totalParts: number;
  sourceKey: string; // object key in cloud storage
  duration: number | null; // seconds
  size: number; // bytes
  status: MediaStatus;
  isPrivate: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  statusUpdatedAt: Date;
}

export class Media {
  readonly id: string;
  readonly ownerId: string;
  readonly type: MediaType;
  readonly totalParts: number;
  readonly partSize: number;
  readonly sourceKey: string;
  readonly size: number;
  readonly createdAt: Date;

  title: string;
  description: string;
  uploadId: string | null;
  duration: number | null;
  status: MediaStatus;
  isPrivate: boolean;
  isDeleted: boolean;
  updatedAt: Date;
  statusUpdatedAt: Date;

  private constructor(props: MediaProps) {
    this.id = props.id;
    this.ownerId = props.ownerId;
    this.type = props.type;
    this.totalParts = props.totalParts;
    this.sourceKey = props.sourceKey;
    this.size = props.size;
    this.createdAt = props.createdAt;
    this.title = props.title;
    this.description = props.description;
    this.uploadId = props.uploadId;
    this.duration = props.duration;
    this.status = props.status;
    this.isPrivate = props.isPrivate;
    this.isDeleted = props.isDeleted;
    this.updatedAt = props.updatedAt;
    this.statusUpdatedAt = props.statusUpdatedAt;
  }

  static create(params: CreateMediaParams, now = new Date()): Media {
    return new Media({
      ...params,
      duration: null,
      status: MediaStatus.INITIATING,
      isPrivate: params.isPrivate ?? false,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
      statusUpdatedAt: now,
      sourceKey: Media.buildSourceKey(params.id),
      uploadId: null,
    });
  }

  static reconstitute(props: MediaProps): Media {
    return new Media(props);
  }

  static buildSourceKey(id: string): string {
    return `media/${id}/original`;
  }
  updateDetails(
    changes: { title?: string; description?: string; isPrivate?: boolean },
    now = new Date(),
  ): void {
    if (changes.title !== undefined) this.title = changes.title;
    if (changes.description !== undefined)
      this.description = changes.description;
    if (changes.isPrivate !== undefined) this.isPrivate = changes.isPrivate;
    this.updatedAt = now;
  }

  markInitiating(): void {
    this.setStatus(MediaStatus.INITIATING);
  }

  startProcessing(): void {
    this.setStatus(MediaStatus.PROCESSING);
  }

  markReady(duration: number): void {
    this.setStatus(MediaStatus.READY);
    this.duration = duration;
  }

  markFailed(): void {
    this.setStatus(MediaStatus.FAILED);
  }

  softDelete(): void {
    this.isDeleted = true;
    this.updatedAt = new Date();
  }

  attachUploadId(uploadId: string): void {
    this.uploadId = uploadId;
    this.setStatus(MediaStatus.UPLOADING);
  }

  private setStatus(status: MediaStatus): void {
    const now = new Date();
    this.status = status;
    this.statusUpdatedAt = now;
    this.updatedAt = now;
  }
}
