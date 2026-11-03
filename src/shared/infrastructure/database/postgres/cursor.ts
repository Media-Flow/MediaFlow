import { BadRequestException } from '@nestjs/common';

export interface CreatedAtIdCursor {
  createdAt: Date;
  id: string;
}

export function encodeCreatedAtIdCursor(createdAt: Date, id: string): string {
  return Buffer.from(
    JSON.stringify({ c: createdAt.toISOString(), i: id }),
  ).toString('base64url');
}

export function decodeCreatedAtIdCursor(cursor: string): CreatedAtIdCursor {
  try {
    const decoded: unknown = JSON.parse(
      Buffer.from(cursor, 'base64url').toString('utf8'),
    );

    if (
      typeof decoded !== 'object' ||
      decoded === null ||
      !('c' in decoded) ||
      !('i' in decoded) ||
      typeof decoded.c !== 'string' ||
      typeof decoded.i !== 'string' ||
      decoded.i.length === 0
    ) {
      throw new Error('Invalid cursor payload');
    }

    const createdAt = new Date(decoded.c);
    if (Number.isNaN(createdAt.getTime())) {
      throw new Error('Invalid cursor date');
    }

    return { createdAt, id: decoded.i };
  } catch {
    throw new BadRequestException('Invalid cursor');
  }
}
