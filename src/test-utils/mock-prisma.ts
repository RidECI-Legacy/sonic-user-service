interface MockPrismaShape {
  users: Record<
    'findUnique' | 'create' | 'update' | 'count' | 'findMany',
    jest.Mock
  >;
  profiles: Record<
    'findUnique' | 'create' | 'update' | 'count' | 'findMany',
    jest.Mock
  >;
  vehicles: Record<'findFirst' | 'findMany' | 'create' | 'update', jest.Mock>;
  ratings: Record<
    'create' | 'aggregate' | 'groupBy' | 'count' | 'findMany',
    jest.Mock
  >;
  $transaction: jest.Mock;
  $connect: jest.Mock;
  $disconnect: jest.Mock;
}

export function createMockPrisma(): MockPrismaShape {
  const prisma: MockPrismaShape = {
    users: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    profiles: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    vehicles: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    ratings: {
      create: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };

  prisma.$transaction.mockImplementation(async (arg: unknown) => {
    if (Array.isArray(arg)) {
      return Promise.all(arg);
    }
    if (typeof arg === 'function') {
      return (arg as (tx: MockPrismaShape) => unknown)(prisma);
    }
    throw new Error('Unsupported $transaction argument in mock');
  });

  return prisma;
}

export type MockPrisma = MockPrismaShape;
