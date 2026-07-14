import { PrismaClient } from '@prisma/client';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  it('onModuleInit connects and onModuleDestroy disconnects', async () => {
    const connectSpy = jest
      .spyOn(PrismaClient.prototype, '$connect')
      .mockResolvedValue(undefined);
    const disconnectSpy = jest
      .spyOn(PrismaClient.prototype, '$disconnect')
      .mockResolvedValue(undefined);

    const service = new PrismaService();

    await service.onModuleInit();
    expect(connectSpy).toHaveBeenCalled();

    await service.onModuleDestroy();
    expect(disconnectSpy).toHaveBeenCalled();

    connectSpy.mockRestore();
    disconnectSpy.mockRestore();
  });
});
