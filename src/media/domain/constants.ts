export enum MediaType {
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
}

export enum MediaStatus {
  READY = 'READY',
  FAILED = 'FAILED',
  PROCESSING = 'PROCESSING',
  UPLOADING = 'UPLOADING',
  INITIATING = 'INITIATING',
}

export const PART_URL_TTL_SECONDS = 10 * 60; //10 minuts

export const PART_SIZE = 25; //MB
