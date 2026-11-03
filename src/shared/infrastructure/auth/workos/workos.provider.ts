import { ConfigService } from '@nestjs/config';
import { WorkOS } from '@workos-inc/node';

export const WORKOS_PROVIDER = Symbol('WORKOS_PROVIDER');
export const WorkosProvider = {
  provide: WORKOS_PROVIDER,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const port = configService.get<string>('WORKOS_PORT');
    return new WorkOS(configService.getOrThrow('WORKOS_API_KEY'), {
      clientId: configService.getOrThrow('WORKOS_CLIENT_ID'),
      apiHostname: configService.get<string>('WORKOS_API_HOSTNAME'),
      port: port ? Number(port) : undefined,
      https: configService.get<string>('WORKOS_HTTPS') !== 'false',
    });
  },
};
