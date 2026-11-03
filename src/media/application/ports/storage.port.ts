export const STORAGE = Symbol('STORAGE');

export interface StoragePort {
  createMultipartUpload(key: string): Promise<string>;
  presignPartUrls(params: {
    key: string;
    uploadId: string;
    from: number;
    count: number;
  }): Promise<{ partNumber: number; url: string }[]>;
  completeMultipartUpload(params: {
    key: string;
    uploadId: string;
    parts: { PartNumber: number; ETag: string }[];
  }): Promise<void>;
  abortMultipartUpload(key: string, uploadId: string): Promise<void>;
  listUploadedParts(
    key: string,
    uploadId: string,
  ): Promise<{ PartNumber: number; ETag: string }[]>;
}
