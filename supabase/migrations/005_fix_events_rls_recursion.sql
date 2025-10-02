-- Fix infinite recursion in RLS policies for events tables
-- This migration completely removes circular dependencies by using simple, direct policies

-- Disable RLS temporarily to drop all policies cleanly
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees DISABLE ROW LEVEL SECURITY;
ALTER TABLE event_organizers DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Public events are viewable by everyone" ON events;
DROP POLICY IF EXISTS "Users can view their own events" ON events;
DROP POLICY IF EXISTS "Users can view events they're attending" ON events;
DROP POLICY IF EXISTS "Users can view events they're organizing" ON events;
DROP POLICY IF EXISTS "Authenticated users can create events" ON events;
DROP POLICY IF EXISTS "Users can update their own events" ON events;
DROP POLICY IF EXISTS "Organizers can update events" ON events;
DROP POLICY IF EXISTS "Users can delete their own events" ON events;

DROP POLICY IF EXISTS "Users can view attendees of public events" ON event_attendees;
DROP POLICY IF EXISTS "Users can view attendees of events they're part of" ON event_attendees;
DROP POLICY IF EXISTS "Users can join events" ON event_attendees;
DROP POLICY IF EXISTS "Users can update their own attendance" ON event_attendees;
DROP POLICY IF EXISTS "Users can leave events" ON event_attendees;
DROP POLICY IF EXISTS "Organizers can manage attendees" ON event_attendees;

DROP POLICY IF EXISTS "Users can view organizers of public events" ON event_organizers;
DROP POLICY IF EXISTS "Users can view organizers of events they're part of" ON event_organizers;
DROP POLICY IF EXISTS "Event creators can add organizers" ON event_organizers;
DROP POLICY IF EXISTS "Event creators can update organizers" ON event_organizers;
DROP POLICY IF EXISTS "Event creators can remove organizers" ON event_organizers;

-- Re-enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_organizers ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies for events
-- Allow reading public events and events created by the user
CREATE POLICY "events_read_policy" ON events
    FOR SELECT USING (
        is_public = true 
        OR auth.uid() = created_by
    );

-- Allow authenticated users to create events (they become the creator)
CREATE POLICY "events_create_policy" ON events
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' 
        AND auth.uid() = created_by
    );

-- Allow creators to update their own events
CREATE POLICY "events_update_policy" ON events
    FOR UPDATE USING (auth.uid() = created_by);

-- Allow creators to delete their own events
CREATE POLICY "events_delete_policy" ON events
    FOR DELETE USING (auth.uid() = created_by);

-- Create simple policies for event_attendees
-- Users can view all attendee records (for counting purposes)
CREATE POLICY "event_attendees_read_policy" ON event_attendees
    FOR SELECT USING (true);

-- Users can add themselves as attendees
CREATE POLICY "event_attendees_create_policy" ON event_attendees
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own attendance status
CREATE POLICY "event_attendees_update_policy" ON event_attendees
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can remove themselves from events
CREATE POLICY "event_attendees_delete_policy" ON event_attendees
    FOR DELETE USING (auth.uid() = user_id);

-- Create simple policies for event_organizers
-- Users can view all organizer records (for displaying organizers)
CREATE POLICY "event_organizers_read_policy" ON event_organizers
    FOR SELECT USING (true);

-- Only allow organizer creation through application logic (service role)
CREATE POLICY "event_organizers_create_policy" ON event_organizers
    FOR INSERT WITH CHECK (false);

-- Only allow organizer updates through application logic (service role)
CREATE POLICY "event_organizers_update_policy" ON event_organizers
    FOR UPDATE USING (false);

-- Only allow organizer deletion through application logic (service role)
CREATE POLICY "event_organizers_delete_policy" ON event_organizers
    FOR DELETE USING (false);

-- Add helpful comments
COMMENT ON TABLE events IS 'RLS: Public events visible to all, private events only to creators. No circular dependencies.';
COMMENT ON TABLE event_attendees IS 'RLS: All records readable for counting, users can only modify their own attendance.';
COMMENT ON TABLE event_organizers IS 'RLS: All records readable for display, modifications only via service role to prevent abuse.';