import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

interface AuthenticatedRequest {
  user?: {
    externalId?: string;
    appUserId?: string;
    id?: string;
    role?: string;
  };
}

export const CurrentUser = createParamDecorator(
  (_data: string, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const output: string = request.user?.[_data];

    if (!output) {
      throw new UnauthorizedException();
    }

    return output;
  },
);
