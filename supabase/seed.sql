-- Seed script for development environment
-- This script creates realistic test data for the gelaende application
-- Run this in your Supabase SQL editor or via migration

-- First, let's create some test users in auth.users table
-- Note: In a real environment, you'd need to use Supabase auth API or admin functions
-- This is a simplified version for development/testing purposes

-- Create test places first (no dependencies)
INSERT INTO places (place_id, name, location) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Universitätsbibliothek', '{"type": "coordinates", "lat": 48.1351, "lng": 11.5820, "address": "Universitätsbibliothek, München", "city": "München"}'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Mensa Zentral', '{"type": "coordinates", "lat": 48.1372, "lng": 11.5756, "address": "Mensa Zentral, München", "city": "München"}'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Campus Café', '{"type": "coordinates", "lat": 48.1389, "lng": 11.5831, "address": "Campus Café, München", "city": "München"}'),
  ('550e8400-e29b-41d4-a716-446655440004', 'Studentenwohnheim Nord', '{"type": "coordinates", "lat": 48.1445, "lng": 11.5687, "address": "Studentenwohnheim Nord, München", "city": "München"}'),
  ('550e8400-e29b-41d4-a716-446655440005', 'Hörsaal A', '{"type": "coordinates", "lat": 48.1356, "lng": 11.5804, "address": "Hörsaal A, München", "city": "München"}'),
  ('550e8400-e29b-41d4-a716-446655440006', 'Labor 3.14', '{"type": "coordinates", "lat": 48.1367, "lng": 11.5812, "address": "Labor 3.14, München", "city": "München"}'),
  ('550e8400-e29b-41d4-a716-446655440007', 'Audimax', '{"type": "coordinates", "lat": 48.1378, "lng": 11.5789, "address": "Audimax, München", "city": "München"}'),
  ('550e8400-e29b-41d4-a716-446655440008', 'Sportplatz', '{"type": "coordinates", "lat": 48.1423, "lng": 11.5701, "address": "Sportplatz, München", "city": "München"}');

-- Note: To create actual test users with authentication, you would need to:
-- 1. Use Supabase auth.signup() function or admin API
-- 2. Or use the Supabase dashboard to create test users manually
-- 3. Then get their UUIDs and use them in the following inserts

-- For now, we'll use placeholder UUIDs that you should replace with real auth.users IDs
-- These would be the UUIDs of actual users created through Supabase auth

-- Create test profiles (replace these UUIDs with real auth.users IDs)
INSERT INTO profiles (profile_id, name, studiengang, university, user_id) VALUES
  ('650e8400-e29b-41d4-a716-446655440001', 'Max Müller', 'Informatik', 'TU München', '00000000-0000-0000-0000-000000000001'),
  ('650e8400-e29b-41d4-a716-446655440002', 'Anna Schmidt', 'Maschinenbau', 'TU München', '00000000-0000-0000-0000-000000000002'),
  ('650e8400-e29b-41d4-a716-446655440003', 'David Fischer', 'Elektrotechnik', 'TU München', '00000000-0000-0000-0000-000000000003'),
  ('650e8400-e29b-41d4-a716-446655440004', 'Julia Weber', 'BWL', 'LMU München', '00000000-0000-0000-0000-000000000004'),
  ('650e8400-e29b-41d4-a716-446655440005', 'Felix Meyer', 'Informatik', 'TU München', '00000000-0000-0000-0000-000000000005'),
  ('650e8400-e29b-41d4-a716-446655440006', 'Laura Wagner', 'Psychologie', 'LMU München', '00000000-0000-0000-0000-000000000006'),
  ('650e8400-e29b-41d4-a716-446655440007', 'Leon Becker', 'Jura', 'LMU München', '00000000-0000-0000-0000-000000000007'),
  ('650e8400-e29b-41d4-a716-446655440008', 'Emma Schulz', 'Medizin', 'LMU München', '00000000-0000-0000-0000-000000000008');

-- Create some activities
INSERT INTO activities (activity_id, user_id, place_id, time) VALUES
  ('750e8400-e29b-41d4-a716-446655440001', '00000000-0000-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440001', '2024-09-19 10:30:00+00'),
  ('750e8400-e29b-41d4-a716-446655440002', '00000000-0000-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440002', '2024-09-19 12:00:00+00'),
  ('750e8400-e29b-41d4-a716-446655440003', '00000000-0000-0000-0000-000000000002', '550e8400-e29b-41d4-a716-446655440003', '2024-09-19 14:15:00+00'),
  ('750e8400-e29b-41d4-a716-446655440004', '00000000-0000-0000-0000-000000000002', '550e8400-e29b-41d4-a716-446655440001', '2024-09-19 16:45:00+00'),
  ('750e8400-e29b-41d4-a716-446655440005', '00000000-0000-0000-0000-000000000003', '550e8400-e29b-41d4-a716-446655440005', '2024-09-20 09:00:00+00'),
  ('750e8400-e29b-41d4-a716-446655440006', '00000000-0000-0000-0000-000000000004', '550e8400-e29b-41d4-a716-446655440002', '2024-09-20 11:30:00+00'),
  ('750e8400-e29b-41d4-a716-446655440007', '00000000-0000-0000-0000-000000000005', '550e8400-e29b-41d4-a716-446655440006', '2024-09-20 13:00:00+00'),
  ('750e8400-e29b-41d4-a716-446655440008', '00000000-0000-0000-0000-000000000006', '550e8400-e29b-41d4-a716-446655440004', '2024-09-20 15:20:00+00');

-- Create some friendships
INSERT INTO friendships (friendship_id, user1_id, user2_id) VALUES
  ('850e8400-e29b-41d4-a716-446655440001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002'),
  ('850e8400-e29b-41d4-a716-446655440002', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005'),
  ('850e8400-e29b-41d4-a716-446655440003', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003'),
  ('850e8400-e29b-41d4-a716-446655440004', '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000006'),
  ('850e8400-e29b-41d4-a716-446655440005', '00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000006');

-- Create some friendship invites
INSERT INTO friendship_invites (invite_id, requester_id, requestee_id, status) VALUES
  ('950e8400-e29b-41d4-a716-446655440001', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 'pending'),
  ('950e8400-e29b-41d4-a716-446655440002', '00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000008', 'pending'),
  ('950e8400-e29b-41d4-a716-446655440003', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000007', 'pending'),
  ('950e8400-e29b-41d4-a716-446655440004', '00000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000005', 'rejected');

-- Additional places for more variety
INSERT INTO places (place_id, name, location) VALUES
  ('550e8400-e29b-41d4-a716-446655440009', 'Botanischer Garten', '{"type": "coordinates", "lat": 48.1167, "lng": 11.5056, "address": "Botanischer Garten, München", "city": "München"}'),
  ('550e8400-e29b-41d4-a716-446655440010', 'Fitness Studio Campus', '{"type": "coordinates", "lat": 48.1401, "lng": 11.5734, "address": "Fitness Studio Campus, München", "city": "München"}'),
  ('550e8400-e29b-41d4-a716-446655440011', 'Co-Working Space TUM', '{"type": "coordinates", "lat": 48.1390, "lng": 11.5825, "address": "Co-Working Space TUM, München", "city": "München"}'),
  ('550e8400-e29b-41d4-a716-446655440012', 'Buchhandlung Uni', '{"type": "coordinates", "lat": 48.1365, "lng": 11.5798, "address": "Buchhandlung Uni, München", "city": "München"}');

-- More activities to create a richer dataset
INSERT INTO activities (activity_id, user_id, place_id, time) VALUES
  ('750e8400-e29b-41d4-a716-446655440009', '00000000-0000-0000-0000-000000000007', '550e8400-e29b-41d4-a716-446655440009', '2024-09-18 10:00:00+00'),
  ('750e8400-e29b-41d4-a716-446655440010', '00000000-0000-0000-0000-000000000008', '550e8400-e29b-41d4-a716-446655440010', '2024-09-18 17:30:00+00'),
  ('750e8400-e29b-41d4-a716-446655440011', '00000000-0000-0000-0000-000000000003', '550e8400-e29b-41d4-a716-446655440011', '2024-09-17 14:00:00+00'),
  ('750e8400-e29b-41d4-a716-446655440012', '00000000-0000-0000-0000-000000000004', '550e8400-e29b-41d4-a716-446655440012', '2024-09-17 11:15:00+00'),
  ('750e8400-e29b-41d4-a716-446655440013', '00000000-0000-0000-0000-000000000006', '550e8400-e29b-41d4-a716-446655440007', '2024-09-16 08:45:00+00'),
  ('750e8400-e29b-41d4-a716-446655440014', '00000000-0000-0000-0000-000000000005', '550e8400-e29b-41d4-a716-446655440008', '2024-09-16 19:00:00+00');

-- Add some historical activities to show timeline
INSERT INTO activities (activity_id, user_id, place_id, time) VALUES
  ('750e8400-e29b-41d4-a716-446655440015', '00000000-0000-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440001', '2024-09-15 09:30:00+00'),
  ('750e8400-e29b-41d4-a716-446655440016', '00000000-0000-0000-0000-000000000002', '550e8400-e29b-41d4-a716-446655440002', '2024-09-15 12:45:00+00'),
  ('750e8400-e29b-41d4-a716-446655440017', '00000000-0000-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440005', '2024-09-14 14:00:00+00'),
  ('750e8400-e29b-41d4-a716-446655440018', '00000000-0000-0000-0000-000000000003', '550e8400-e29b-41d4-a716-446655440003', '2024-09-14 16:30:00+00');