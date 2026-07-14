export function createMockSupabaseService() {
  return {
    signUp: jest.fn(),
    signIn: jest.fn(),
    refreshSession: jest.fn(),
    resetPasswordForEmail: jest.fn(),
    updateUserPassword: jest.fn(),
    uploadFile: jest.fn(),
    getPublicUrl: jest.fn(),
    getSignedUrl: jest.fn(),
    deleteFile: jest.fn(),
    deleteAuthUser: jest.fn(),
    getAuthUser: jest.fn(),
    auth: {
      getUser: jest.fn(),
    },
  };
}

export type MockSupabaseService = ReturnType<typeof createMockSupabaseService>;

export function createMockExecutionContext(request: unknown) {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as import('@nestjs/common').ExecutionContext;
}
