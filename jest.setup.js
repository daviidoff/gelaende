import "@testing-library/jest-dom";

// Mock next/cache
jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

// Mock next/headers
jest.mock("next/headers", () => ({
  cookies: jest.fn(() => ({
    getAll: jest.fn(() => []),
    set: jest.fn(),
  })),
}));

// Enhanced mock for Supabase client
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

// Global test setup
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Global test utilities
global.testUtils = {
  // Utility to generate mock UUIDs for tests
  generateMockUUID: () =>
    `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,

  // Utility to create consistent test dates
  createTestDate: (daysAgo = 0) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString();
  },

  // Utility to reset all mocks
  resetAllMocks: () => {
    jest.clearAllMocks();
  },
};

// Setup test environment
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
});

// Cleanup after tests
afterEach(() => {
  // Additional cleanup if needed
});
