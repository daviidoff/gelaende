# Profile Creation Flow

## Overview

This document explains how the app ensures that authenticated users must create a profile before accessing protected routes.

## Implementation

### 1. Middleware Check (`lib/supabase/middleware.ts`)

The middleware runs on every request and performs the following checks:

1. **Authentication Check**: Verifies if the user is authenticated
2. **Profile Check**: For authenticated users (except on auth routes and `/profile/create`), checks if a profile exists
3. **Redirect**: If no profile exists, redirects to `/profile/create`

**Protected Routes**: All routes except:

- `/` (landing page)
- `/auth/*` (authentication pages)
- `/profile/create` (profile creation page)

### 2. Helper Function (`lib/supabase/profile.ts`)

`checkUserProfile()` - A reusable server-side function that:

- Gets the current authenticated user
- Checks if a profile exists in the `profiles` table
- Returns `{ hasProfile, user, profile }`

### 3. Profile Creation Page (`app/profile/create/page.tsx`)

Server component that:

- Redirects users who already have a profile to `/map`
- Redirects unauthenticated users to `/auth/login`
- Shows the profile creation form for authenticated users without a profile

### 4. Profile Creation Component (`components/tabs/profile/createProfileTab.tsx`)

Client component that:

- Renders a form for creating a profile
- On successful profile creation:
  - Shows success message
  - Automatically redirects to `/map` after 1.5 seconds
  - Refreshes the router to update the middleware state

## User Flow

### New User Sign-up Flow:

1. User signs up → `/auth/sign-up`
2. Email confirmation → `/auth/sign-up-success`
3. User confirms email and logs in
4. User tries to access any protected route (e.g., `/map`, `/events`, `/friends`)
5. Middleware detects no profile → Redirects to `/profile/create`
6. User creates profile
7. Automatic redirect to `/map`
8. User can now access all protected routes

### Existing User with Profile:

1. User logs in
2. Middleware detects existing profile
3. User can access all protected routes normally

### User Tries to Access `/profile/create` with Existing Profile:

1. Page-level check detects existing profile
2. Redirects to `/map`

## Database Schema

### Users Table (managed by Supabase Auth)

- Stores authentication data
- Created automatically on sign-up

### Profiles Table

- `profile_id` (UUID, primary key)
- `user_id` (UUID, foreign key to auth.users)
- `name` (text, required)
- `studiengang` (text, optional)
- `university` (text, optional)
- `created_at`, `updated_at`

## Key Benefits

1. **Automatic Enforcement**: Middleware ensures no user can bypass profile creation
2. **User-Friendly**: Automatic redirect after profile creation
3. **Prevents Duplicate Profiles**: Server-side validation in profile creation action
4. **Reusable**: `checkUserProfile()` can be used in any server component
5. **Performance**: Single database query in middleware for profile check

## Testing Checklist

- [ ] New user without profile accessing `/map` → Redirected to `/profile/create`
- [ ] User creates profile → Redirected to `/map`
- [ ] User with profile accessing `/profile/create` → Redirected to `/map`
- [ ] Unauthenticated user accessing `/profile/create` → Redirected to `/auth/login`
- [ ] User with profile can access all routes normally
- [ ] Auth routes (`/auth/*`) accessible without profile

## Potential Improvements

1. **Add Loading State**: Show loading indicator during profile check
2. **Customizable Redirect**: Allow users to specify where to go after profile creation
3. **Profile Completion**: Add optional fields that can be filled later
4. **Welcome Tour**: Show onboarding after first profile creation
