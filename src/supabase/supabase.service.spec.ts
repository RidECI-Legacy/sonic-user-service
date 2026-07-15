jest.mock('@supabase/supabase-js', () => {
  const mockAuth = {
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    refreshSession: jest.fn(),
    resetPasswordForEmail: jest.fn(),
    setSession: jest.fn(),
    updateUser: jest.fn(),
    admin: {
      deleteUser: jest.fn(),
      getUserById: jest.fn(),
    },
  };
  const mockStorageBucket = {
    upload: jest.fn(),
    getPublicUrl: jest.fn(),
    createSignedUrl: jest.fn(),
    remove: jest.fn(),
  };
  const mockStorage = { from: jest.fn(() => mockStorageBucket) };
  const mockClient = { auth: mockAuth, storage: mockStorage };
  return {
    createClient: jest.fn(() => mockClient),
    __mockAuth: mockAuth,
    __mockStorageBucket: mockStorageBucket,
  };
});

import { SupabaseService } from './supabase.service';

interface MockAuth {
  signUp: jest.Mock;
  signInWithPassword: jest.Mock;
  refreshSession: jest.Mock;
  resetPasswordForEmail: jest.Mock;
  setSession: jest.Mock;
  updateUser: jest.Mock;
  admin: {
    deleteUser: jest.Mock;
    getUserById: jest.Mock;
  };
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const supabaseJsMock = require('@supabase/supabase-js') as {
  __mockAuth: MockAuth;
  __mockStorageBucket: Record<string, jest.Mock>;
};
const mockAuth = supabaseJsMock.__mockAuth;
const mockStorageBucket = supabaseJsMock.__mockStorageBucket;

describe('SupabaseService', () => {
  let service: SupabaseService;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
    process.env.SECRET_KEY = 'anon-key';
    service = new SupabaseService();
    service.onModuleInit();
  });

  it('signUp returns the created user', async () => {
    mockAuth.signUp.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });
    const user = await service.signUp('a@b.com', 'pw');
    expect(user).toEqual({ id: 'user-1' });
  });

  it('signUp throws when Supabase returns an error', async () => {
    mockAuth.signUp.mockResolvedValue({
      data: { user: null },
      error: new Error('boom'),
    });
    await expect(service.signUp('a@b.com', 'pw')).rejects.toThrow('boom');
  });

  it('signUp throws when no user is returned', async () => {
    mockAuth.signUp.mockResolvedValue({ data: { user: null }, error: null });
    await expect(service.signUp('a@b.com', 'pw')).rejects.toThrow(
      'No user returned from Supabase signUp',
    );
  });

  it('signIn returns session and user', async () => {
    mockAuth.signInWithPassword.mockResolvedValue({
      data: {
        session: {
          access_token: 'at',
          refresh_token: 'rt',
          expires_in: 3600,
          token_type: 'bearer',
        },
        user: { id: 'user-1', email: 'a@b.com' },
      },
      error: null,
    });
    const result = await service.signIn('a@b.com', 'pw');
    expect(result.session.access_token).toBe('at');
    expect(result.user.id).toBe('user-1');
  });

  it('signIn throws on Supabase error', async () => {
    mockAuth.signInWithPassword.mockResolvedValue({
      data: { session: null, user: null },
      error: new Error('bad creds'),
    });
    await expect(service.signIn('a@b.com', 'pw')).rejects.toThrow('bad creds');
  });

  it('signIn throws when no session is returned', async () => {
    mockAuth.signInWithPassword.mockResolvedValue({
      data: { session: null, user: null },
      error: null,
    });
    await expect(service.signIn('a@b.com', 'pw')).rejects.toThrow(
      'No session returned from Supabase signIn',
    );
  });

  it('refreshSession returns session and user', async () => {
    mockAuth.refreshSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'at2',
          refresh_token: 'rt2',
          expires_in: 3600,
          token_type: 'bearer',
        },
        user: { id: 'user-1' },
      },
      error: null,
    });
    const result = await service.refreshSession('rt');
    expect(result.session.access_token).toBe('at2');
  });

  it('refreshSession throws when no session is returned', async () => {
    mockAuth.refreshSession.mockResolvedValue({
      data: { session: null, user: null },
      error: null,
    });
    await expect(service.refreshSession('rt')).rejects.toThrow(
      'No session returned from Supabase refreshSession',
    );
  });

  it('resetPasswordForEmail resolves when no error', async () => {
    mockAuth.resetPasswordForEmail.mockResolvedValue({ error: null });
    await expect(
      service.resetPasswordForEmail('a@b.com'),
    ).resolves.toBeUndefined();
  });

  it('resetPasswordForEmail throws on error', async () => {
    mockAuth.resetPasswordForEmail.mockResolvedValue({
      error: new Error('fail'),
    });
    await expect(service.resetPasswordForEmail('a@b.com')).rejects.toThrow(
      'fail',
    );
  });

  it('updateUserPassword sets session and updates password', async () => {
    mockAuth.setSession.mockResolvedValue({ error: null });
    mockAuth.updateUser.mockResolvedValue({ error: null });
    await expect(
      service.updateUserPassword('at', 'rt', 'newpw'),
    ).resolves.toBeUndefined();
    expect(mockAuth.setSession).toHaveBeenCalledWith({
      access_token: 'at',
      refresh_token: 'rt',
    });
    expect(mockAuth.updateUser).toHaveBeenCalledWith({ password: 'newpw' });
  });

  it('updateUserPassword throws when setSession fails', async () => {
    mockAuth.setSession.mockResolvedValue({ error: new Error('bad token') });
    await expect(
      service.updateUserPassword('at', 'rt', 'newpw'),
    ).rejects.toThrow('bad token');
  });

  it('updateUserPassword throws when updateUser fails', async () => {
    mockAuth.setSession.mockResolvedValue({ error: null });
    mockAuth.updateUser.mockResolvedValue({ error: new Error('fail') });
    await expect(
      service.updateUserPassword('at', 'rt', 'newpw'),
    ).rejects.toThrow('fail');
  });

  it('uploadFile uploads and returns the path', async () => {
    mockStorageBucket.upload.mockResolvedValue({ error: null });
    const path = await service.uploadFile('bucket', 'path/file.png', {
      buffer: Buffer.from('x'),
      originalname: 'file.png',
      mimetype: 'image/png',
    });
    expect(path).toBe('path/file.png');
  });

  it('uploadFile throws on error', async () => {
    mockStorageBucket.upload.mockResolvedValue({ error: new Error('fail') });
    await expect(
      service.uploadFile('bucket', 'path/file.png', {
        buffer: Buffer.from('x'),
        originalname: 'file.png',
        mimetype: 'image/png',
      }),
    ).rejects.toThrow('fail');
  });

  it('getPublicUrl returns the public url', () => {
    mockStorageBucket.getPublicUrl.mockReturnValue({
      data: { publicUrl: 'https://example.com/file.png' },
    });
    expect(service.getPublicUrl('bucket', 'path')).toBe(
      'https://example.com/file.png',
    );
  });

  it('getSignedUrl returns the signed url', async () => {
    mockStorageBucket.createSignedUrl.mockResolvedValue({
      data: { signedUrl: 'https://example.com/signed' },
      error: null,
    });
    await expect(service.getSignedUrl('bucket', 'path')).resolves.toBe(
      'https://example.com/signed',
    );
  });

  it('getSignedUrl throws on error', async () => {
    mockStorageBucket.createSignedUrl.mockResolvedValue({
      data: null,
      error: new Error('fail'),
    });
    await expect(service.getSignedUrl('bucket', 'path')).rejects.toThrow(
      'fail',
    );
  });

  it('deleteFile resolves when no error', async () => {
    mockStorageBucket.remove.mockResolvedValue({ error: null });
    await expect(service.deleteFile('bucket', 'path')).resolves.toBeUndefined();
  });

  it('deleteFile throws on error', async () => {
    mockStorageBucket.remove.mockResolvedValue({ error: new Error('fail') });
    await expect(service.deleteFile('bucket', 'path')).rejects.toThrow('fail');
  });

  it('deleteAuthUser calls admin.deleteUser', async () => {
    mockAuth.admin.deleteUser.mockResolvedValue({ error: null });
    await service.deleteAuthUser('user-1');
    expect(mockAuth.admin.deleteUser).toHaveBeenCalledWith('user-1');
  });

  it('getAuthUser returns confirmation status and createdAt', async () => {
    mockAuth.admin.getUserById.mockResolvedValue({
      data: {
        user: {
          email_confirmed_at: '2026-01-01T00:00:00Z',
          created_at: '2025-01-01T00:00:00Z',
        },
      },
      error: null,
    });
    const result = await service.getAuthUser('user-1');
    expect(result).toEqual({
      emailConfirmed: true,
      createdAt: '2025-01-01T00:00:00Z',
    });
  });

  it('getAuthUser returns emailConfirmed=false when not confirmed', async () => {
    mockAuth.admin.getUserById.mockResolvedValue({
      data: {
        user: { email_confirmed_at: null, created_at: '2025-01-01T00:00:00Z' },
      },
      error: null,
    });
    const result = await service.getAuthUser('user-1');
    expect(result?.emailConfirmed).toBe(false);
  });

  it('getAuthUser returns null on error', async () => {
    mockAuth.admin.getUserById.mockResolvedValue({
      data: { user: null },
      error: new Error('not found'),
    });
    const result = await service.getAuthUser('user-1');
    expect(result).toBeNull();
  });
});
