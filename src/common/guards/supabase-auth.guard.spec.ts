import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import { SupabaseAuthGuard } from './supabase-auth.guard';
import {
  createMockPrisma,
  type MockPrisma,
} from '../../test-utils/mock-prisma';
import {
  createMockExecutionContext,
  createMockSupabaseService,
  type MockSupabaseService,
} from '../../test-utils/mock-supabase';

describe('SupabaseAuthGuard', () => {
  let guard: SupabaseAuthGuard;
  let supabase: MockSupabaseService;
  let prisma: MockPrisma;

  beforeEach(() => {
    supabase = createMockSupabaseService();
    prisma = createMockPrisma();
    guard = new SupabaseAuthGuard(supabase as never, prisma as never);
  });

  function requestWithHeader(header?: string) {
    return { headers: { authorization: header } };
  }

  it('throws UnauthorizedException when no Authorization header', async () => {
    const context = createMockExecutionContext(requestWithHeader(undefined));
    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('throws UnauthorizedException when header is not Bearer', async () => {
    const context = createMockExecutionContext(
      requestWithHeader('Basic abc123'),
    );
    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('throws UnauthorizedException when Supabase returns an error', async () => {
    supabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'invalid' },
    });
    const context = createMockExecutionContext(
      requestWithHeader('Bearer sometoken'),
    );
    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('throws ForbiddenException when user is suspended', async () => {
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });
    prisma.users.findUnique.mockResolvedValue({
      id: 'user-1',
      status: UserStatus.SUSPENDED,
    });
    const context = createMockExecutionContext(
      requestWithHeader('Bearer sometoken'),
    );
    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('allows access and sets request.user when token is valid and not suspended', async () => {
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });
    prisma.users.findUnique.mockResolvedValue({
      id: 'user-1',
      status: UserStatus.ACTIVE,
    });
    const request = requestWithHeader('Bearer sometoken') as {
      headers: { authorization: string };
      user?: { id: string };
    };
    const context = createMockExecutionContext(request);

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(request.user).toEqual({ id: 'user-1' });
  });

  it('allows access when the user has no local row yet (status undefined)', async () => {
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-2' } },
      error: null,
    });
    prisma.users.findUnique.mockResolvedValue(null);
    const context = createMockExecutionContext(
      requestWithHeader('Bearer sometoken'),
    );

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });
});
