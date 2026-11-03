import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

interface AuthenticatedRequest {
  user?: {
    externalId?: string;
  };
}

export const ExternalId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const externalId = request.user?.externalId;

    if (!externalId) {
      throw new UnauthorizedException();
    }

    return externalId;
  },
);
