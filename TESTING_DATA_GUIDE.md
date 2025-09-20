# Testing Data Setup Guide

This guide explains how to add and use testing data for users, profiles, friendships, places, and activities in your application.

## Overview

We have several layers of test data utilities:

1. **Test Data Utilities** (`lib/test-data.ts`) - Core functions for generating realistic test data
2. **Test Factories** (`lib/test-factories.ts`) - Mock data factories for unit testing with Supabase mocks
3. **Database Seeding** (`scripts/seed-database.js`) - Script to populate development database with real data
4. **SQL Seeds** (`supabase/seed.sql`) - Raw SQL for quick database seeding

## For Development Environment

### 1. Using the Node.js Seed Script (Recommended)

This creates real auth users and associated data in your Supabase database:

```bash
# Make sure you have your environment variables set
# NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local

npm run seed
```

This will create:

- 8 test users with emails like `max.mueller@example.com`
- All passwords are `testpass123`
- Profiles with realistic German names and universities
- 10+ places around München with coordinates
- Activities showing user visits to places
- Friendships between some users
- Pending friendship invites

### 2. Using SQL Seeds

If you prefer to manually insert data via SQL:

```sql
-- Run the contents of supabase/seed.sql in your Supabase SQL editor
-- Note: You'll need to replace the placeholder UUIDs with real auth.users IDs
```

### 3. Manual Creation via Dashboard

1. Create users in Supabase Auth dashboard
2. Copy their UUIDs
3. Use the seed SQL files, replacing the placeholder UUIDs

## For Unit Testing

### Basic Test Data Generation

```typescript
import {
  createTestUser,
  createTestPlace,
  createTestScenario,
} from "@/lib/test-data";

// Create individual test entities
const user = createTestUser({
  name: "Test User",
  email: "test@example.com",
  studiengang: "Informatik",
});

const place = createTestPlace({
  name: "Test Library",
  location: { type: "coordinates", lat: 48.1351, lng: 11.582 },
});

// Create a complete test scenario
const scenario = createTestScenario(5, 3, 2); // 5 users, 3 places, 2 activities per user
```

### Using Test Factories with Mocks

```typescript
import {
  TestDataFactory,
  TestHelpers,
  MockSupabaseFactory,
} from "@/lib/test-factories";

describe("Your Component", () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    mockSupabaseClient = TestHelpers.createMockSupabaseClient();
    mockCreateClient.mockResolvedValue(mockSupabaseClient);
  });

  it("should handle user data", async () => {
    // Create realistic test data
    const user = TestDataFactory.createAuthUser({
      email: "test@example.com",
      name: "Test User",
    });

    // Mock the auth response
    TestHelpers.mockAuthUser(mockSupabaseClient, user);

    // Mock database responses
    const friendships = [
      TestDataFactory.createFriendship(user.id, "friend-id"),
    ];
    TestHelpers.mockFriendships(mockSupabaseClient, friendships);

    // Your test logic here...
  });
});
```

### Pre-built Test Data

For quick testing, use the pre-built constants:

```typescript
import {
  TEST_USER_1,
  TEST_USER_2,
  TEST_PROFILE_1,
  TEST_PLACE_1,
  TEST_FRIENDSHIP_1,
} from "@/lib/test-factories";

// These are ready-to-use test objects with realistic data
```

## Test Data Structure

### Users

- **ID**: UUID format
- **Email**: Realistic German emails (`max.mueller@example.com`)
- **Names**: Common German first/last names
- **Universities**: Real German universities (TU München, LMU München, etc.)
- **Studiengänge**: Common study programs (Informatik, BWL, Medizin, etc.)

### Places

- **Names**: University-related locations (Mensa, Bibliothek, Hörsaal, etc.)
- **Locations**: JSON with coordinates around München area
- **Types**: Mix of coordinates and address formats

### Activities

- **Time**: Realistic timestamps (recent past dates)
- **User-Place relationships**: Each user visits multiple places
- **Variety**: Different times of day, different days

### Friendships

- **Bidirectional**: Properly structured user1_id/user2_id pairs
- **Realistic distribution**: ~30% of possible user pairs are friends
- **No self-friendships**: Built-in validation

### Friendship Invites

- **Status variety**: Mix of pending, accepted, rejected
- **No duplicates**: Prevents multiple invites between same users
- **Realistic scenarios**: Some accepted (become friendships), some pending

## Best Practices

### 1. Test Isolation

Always use fresh test data for each test:

```typescript
beforeEach(() => {
  // Create new test data for each test
  const scenario = TestDataFactory.createTestScenario();
});
```

### 2. Realistic Data

Use the provided factories to create realistic German university data:

```typescript
// Good - realistic data
const user = createTestUser({
  name: "Anna Schmidt",
  studiengang: "Informatik",
  university: "TU München",
});

// Avoid - unrealistic data
const user = createTestUser({
  name: "Test User 123",
  studiengang: "Test Program",
});
```

### 3. Mock Configuration

Configure mocks appropriately for your test scenarios:

```typescript
// For success scenarios
TestHelpers.mockSuccessfulInsert(mockClient, expectedData);

// For error scenarios
TestHelpers.mockError(mockClient, "User not found", "USER_NOT_FOUND");

// For empty results
TestHelpers.mockEmptyListResponse(mockClient);
```

### 4. Test Data Consistency

Keep related data consistent:

```typescript
const user = TestDataFactory.createAuthUser();
const profile = TestDataFactory.createProfile(user.id); // Use same ID
const activity = TestDataFactory.createActivity(user.id, place.place_id); // Related data
```

## Troubleshooting

### Development Database Issues

**Problem**: Seed script fails with authentication error

```bash
❌ Missing required environment variables:
   NEXT_PUBLIC_SUPABASE_URL
   SUPABASE_SERVICE_ROLE_KEY
```

**Solution**: Add the service role key to your `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # Not the anon key!
```

**Problem**: Users created but no profiles
**Solution**: Check RLS policies - the service role should bypass RLS or policies should allow profile creation.

### Test Issues

**Problem**: Mock functions not being called
**Solution**: Ensure you're mocking the right modules and the mock is configured before the test runs.

**Problem**: Type errors with test data
**Solution**: Use the TypeScript interfaces provided by the factories, don't create raw objects.

### Data Relationships

**Problem**: Friendship constraints violated
**Solution**: Ensure user1_id and user2_id are different, and the unique constraint is respected.

**Problem**: Activities without places
**Solution**: Create places first, then reference their IDs in activities.

## File Structure

```
lib/
├── test-data.ts          # Core test data utilities
├── test-factories.ts     # Mock factories for unit tests
└── ...

scripts/
└── seed-database.js      # Database seeding script

supabase/
├── seed.sql             # Raw SQL seed data
└── migrations/
    └── 001_initial_schema.sql

components/
└── */
    └── __tests__/
        ├── *.test.ts            # Your actual tests
        └── enhanced-example.test.ts # Example of new patterns
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Seed development database
npm run seed
```

The test utilities are automatically available in all test files through the Jest setup. Happy testing! 🧪
