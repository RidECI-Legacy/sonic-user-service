import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { UserStatus, UserType } from '@prisma/client';
import { AdminGuard } from './admin.guard';
import {
  createMockPrisma,
  type MockPrisma,
} from '../../test-utils/mock-prisma';
import {
  createMockExecutionContext,
  createMockSupabaseService,
  type MockSupabaseService,
} from '../../test-utils/mock-supabase';

describe('AdminGuard', () => {
  let guard: AdminGuard;
  let supabase: MockSupabaseService;
  let prisma: MockPrisma;

  beforeEach(() => {
    supabase = createMockSupabaseService();
    prisma = createMockPrisma();
    guard = new AdminGuard(supabase as never, prisma as never);
  });

  function authedContext(userId: string) {
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    });
    return createMockExecutionContext({
      headers: { authorization: 'Bearer sometoken' },
    });
  }

  it('rejects with UnauthorizedException when not authenticated at all', async () => {
    const context = createMockExecutionContext({ headers: {} });
    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects with ForbiddenException when user is not an admin', async () => {
    const context = authedContext('user-1');
    prisma.users.findUnique
      .mockResolvedValueOnce({ id: 'user-1', status: UserStatus.ACTIVE })
      .mockResolvedValueOnce({
        id: 'user-1',
        role: UserType.STUDENT,
      });

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('rejects with ForbiddenException when user row does not exist', async () => {
    const context = authedContext('user-1');
    prisma.users.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('allows access when user has ADMIN role', async () => {
    const context = authedContext('admin-1');
    prisma.users.findUnique
      .mockResolvedValueOnce({ id: 'admin-1', status: UserStatus.ACTIVE })
      .mockResolvedValueOnce({ id: 'admin-1', role: UserType.ADMIN });

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });
});
