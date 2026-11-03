export interface PageRequest {
  cursor?: string;
  limit: number;
}

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}
