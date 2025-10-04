// Mock Supabase client for testing
export const mockSupabaseClient = {
  auth: {
    getUser: jest.fn(),
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
  },
  from: jest.fn(() => {
    const createMockQueryBuilder = () => {
      const mockQueryBuilder = {
        select: jest.fn(),
        insert: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        eq: jest.fn(),
        or: jest.fn(),
        in: jest.fn(),
        gte: jest.fn(),
        lte: jest.fn(),
        gt: jest.fn(),
        lt: jest.fn(),
        order: jest.fn(),
        limit: jest.fn(),
        single: jest.fn(),
        maybeSingle: jest.fn(),
      };

      // Make all chainable methods return a new promise-like object
      const chainableMethods = [
        "select",
        "insert",
        "update",
        "delete",
        "eq",
        "or",
        "in",
        "gte",
        "lte",
        "gt",
        "lt",
        "order",
        "limit",
      ];
      chainableMethods.forEach((method) => {
        mockQueryBuilder[method] = jest
          .fn()
          .mockReturnValue(createMockQueryBuilder());
      });

      // Terminal methods that resolve the promise
      mockQueryBuilder.single = jest
        .fn()
        .mockResolvedValue({ data: null, error: null });
      mockQueryBuilder.maybeSingle = jest
        .fn()
        .mockResolvedValue({ data: null, error: null });

      // Make the query builder itself thenable (promise-like)
      mockQueryBuilder.then = jest.fn((resolve) =>
        resolve({ data: [], error: null })
      );
      mockQueryBuilder.catch = jest.fn();

      return mockQueryBuilder;
    };

    return createMockQueryBuilder();
  }),
};

export const createServerClient = jest.fn(() => mockSupabaseClient);
