import { ForbiddenException } from '@nestjs/common';
import { LicenseValidation } from '@prisma/client';
import { VerifiedDriverGuard } from './verified-driver.guard';
import {
  createMockPrisma,
  type MockPrisma,
} from '../../test-utils/mock-prisma';
import { createMockExecutionContext } from '../../test-utils/mock-supabase';

describe('VerifiedDriverGuard', () => {
  let guard: VerifiedDriverGuard;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    guard = new VerifiedDriverGuard(prisma as never);
  });

  it('returns false when there is no authenticated user', async () => {
    const context = createMockExecutionContext({ user: undefined });
    await expect(guard.canActivate(context)).resolves.toBe(false);
  });

  it('throws ForbiddenException when profile does not exist', async () => {
    prisma.profiles.findUnique.mockResolvedValue(null);
    const context = createMockExecutionContext({ user: { id: 'user-1' } });
    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('throws ForbiddenException when driver is not verified', async () => {
    prisma.profiles.findUnique.mockResolvedValue({
      licenseValidation: LicenseValidation.PENDING,
    });
    const context = createMockExecutionContext({ user: { id: 'user-1' } });
    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('allows access when driver is verified', async () => {
    prisma.profiles.findUnique.mockResolvedValue({
      licenseValidation: LicenseValidation.VERIFIED,
    });
    const context = createMockExecutionContext({ user: { id: 'user-1' } });
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });
});
