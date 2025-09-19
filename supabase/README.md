# Database Schema Documentation

This document describes the database schema for the Geländе application using Supabase.

## Tables Overview

### `profiles`

Stores user profile information linked to Supabase Auth users.

- `profile_id` (UUID, Primary Key): Unique identifier for the profile
- `name` (VARCHAR): User's display name
- `studiengang` (VARCHAR, nullable): Field of study
- `university` (VARCHAR, nullable): University name
- `user_id` (UUID, Foreign Key): References `auth.users(id)`
- `created_at` (TIMESTAMP): Record creation time
- `updated_at` (TIMESTAMP): Last update time

### `places`

Stores location information for activities.

- `place_id` (UUID, Primary Key): Unique identifier for the place
- `name` (VARCHAR): Place name/title
- `location` (JSONB, nullable): Flexible location data (coordinates, address, etc.)
- `created_at` (TIMESTAMP): Record creation time
- `updated_at` (TIMESTAMP): Last update time

### `activities`

Tracks user activities at specific places and times.

- `activity_id` (UUID, Primary Key): Unique identifier for the activity
- `user_id` (UUID, Foreign Key): References `auth.users(id)`
- `place_id` (UUID, Foreign Key): References `places(place_id)`
- `time` (TIMESTAMP): When the activity takes place
- `created_at` (TIMESTAMP): Record creation time
- `updated_at` (TIMESTAMP): Last update time

### `friendships`

Represents mutual friendships between users.

- `friendship_id` (UUID, Primary Key): Unique identifier for the friendship
- `user1_id` (UUID, Foreign Key): References `auth.users(id)`
- `user2_id` (UUID, Foreign Key): References `auth.users(id)`
- `created_at` (TIMESTAMP): When friendship was established

**Constraints:**

- Users cannot be friends with themselves
- Friendship pairs are unique regardless of order (using LEAST/GREATEST)

### `friendship_invites`

Manages friendship invitation system.

- `invite_id` (UUID, Primary Key): Unique identifier for the invite
- `requester_id` (UUID, Foreign Key): User sending the invite
- `requestee_id` (UUID, Foreign Key): User receiving the invite
- `status` (ENUM): 'pending', 'accepted', or 'rejected'
- `created_at` (TIMESTAMP): When invite was sent
- `updated_at` (TIMESTAMP): Last status update

**Constraints:**

- Users cannot invite themselves
- Only one pending invite allowed between any two users

## Security (Row Level Security)

All tables have RLS enabled with the following policies:

### Profiles

- All users can view all profiles
- Users can only create/update/delete their own profile

### Places

- All users can view all places
- Authenticated users can create places

### Activities

- All users can view all activities
- Users can only create/update/delete their own activities

### Friendships

- Users can only view friendships they're part of
- Users can create/delete friendships involving themselves

### Friendship Invites

- Users can only view invites they sent or received
- Users can only create invites as the requester
- Users can only update invites they received
- Users can delete invites they sent or received

## Database Setup

### 1. Apply the Migration

Run the migration file in your Supabase dashboard or using the Supabase CLI:

```bash
# If using Supabase CLI
supabase db reset
# Or apply the specific migration
supabase db push
```

### 2. Environment Variables

Ensure your `.env.local` file contains:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=your_anon_key
```

### 3. TypeScript Integration

The `lib/types/database.ts` file provides TypeScript types that match your database schema. Import these types in your components:

```typescript
import { Profile, Activity, Place } from "@/lib/types/database";
```

## Usage Examples

### Creating a Profile

```typescript
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

const { data, error } = await supabase.from("profiles").insert({
  name: "John Doe",
  studiengang: "Computer Science",
  university: "TU Munich",
  user_id: user.id,
});
```

### Fetching Activities with Place Details

```typescript
const { data: activities } = await supabase
  .from("activities")
  .select(
    `
    *,
    places (
      name,
      location
    ),
    profiles (
      name
    )
  `
  )
  .eq("user_id", userId);
```

### Managing Friendships

```typescript
// Send friendship invite
const { data } = await supabase.from("friendship_invites").insert({
  requester_id: currentUserId,
  requestee_id: targetUserId,
});

// Accept friendship invite
const { data } = await supabase
  .from("friendship_invites")
  .update({ status: "accepted" })
  .eq("invite_id", inviteId);

// Create friendship after acceptance
const { data } = await supabase.from("friendships").insert({
  user1_id: currentUserId,
  user2_id: friendUserId,
});
```

## Indexes

The schema includes optimized indexes for:

- User lookups across all tables
- Activity time-based queries
- Friendship relationship queries
- Invite status filtering

## Automatic Features

- **UUID Generation**: All primary keys use UUID v4
- **Timestamps**: Automatic `created_at` and `updated_at` timestamps
- **Data Integrity**: Foreign key constraints ensure referential integrity
- **Performance**: Strategic indexes for common query patterns
