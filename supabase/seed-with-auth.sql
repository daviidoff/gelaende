-- Development seed script with proper auth user creation
-- This script creates test users through Supabase auth and then creates associated data
-- Run this using the Supabase CLI or in parts through the dashboard

-- Enable necessary extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Function to create test users (use this approach with Supabase CLI or admin functions)
-- This is a template - you'll need to adapt it to your auth setup

DO $$
DECLARE
    user_ids UUID[] := ARRAY[
        'auth_user_1'::UUID,  -- Replace with actual UUIDs from auth.users
        'auth_user_2'::UUID,
        'auth_user_3'::UUID,
        'auth_user_4'::UUID,
        'auth_user_5'::UUID,
        'auth_user_6'::UUID,
        'auth_user_7'::UUID,
        'auth_user_8'::UUID
    ];
    
    place_ids UUID[] := ARRAY[
        uuid_generate_v4(),
        uuid_generate_v4(),
        uuid_generate_v4(),
        uuid_generate_v4(),
        uuid_generate_v4(),
        uuid_generate_v4(),
        uuid_generate_v4(),
        uuid_generate_v4(),
        uuid_generate_v4(),
        uuid_generate_v4(),
        uuid_generate_v4(),
        uuid_generate_v4()
    ];
BEGIN
    -- Clear existing test data
    DELETE FROM activities WHERE user_id = ANY(user_ids);
    DELETE FROM friendship_invites WHERE requester_id = ANY(user_ids) OR requestee_id = ANY(user_ids);
    DELETE FROM friendships WHERE user1_id = ANY(user_ids) OR user2_id = ANY(user_ids);
    DELETE FROM profiles WHERE user_id = ANY(user_ids);
    DELETE FROM places WHERE name LIKE '%Test%' OR name IN (
        'Universitätsbibliothek', 'Mensa Zentral', 'Campus Café', 'Studentenwohnheim Nord',
        'Hörsaal A', 'Labor 3.14', 'Audimax', 'Sportplatz', 'Botanischer Garten',
        'Fitness Studio Campus', 'Co-Working Space TUM', 'Buchhandlung Uni'
    );

    -- Insert test places
    INSERT INTO places (place_id, name, location) VALUES
        (place_ids[1], 'Universitätsbibliothek', '{"type": "coordinates", "lat": 48.1351, "lng": 11.5820, "address": "Universitätsbibliothek, München", "city": "München"}'),
        (place_ids[2], 'Mensa Zentral', '{"type": "coordinates", "lat": 48.1372, "lng": 11.5756, "address": "Mensa Zentral, München", "city": "München"}'),
        (place_ids[3], 'Campus Café', '{"type": "coordinates", "lat": 48.1389, "lng": 11.5831, "address": "Campus Café, München", "city": "München"}'),
        (place_ids[4], 'Studentenwohnheim Nord', '{"type": "coordinates", "lat": 48.1445, "lng": 11.5687, "address": "Studentenwohnheim Nord, München", "city": "München"}'),
        (place_ids[5], 'Hörsaal A', '{"type": "coordinates", "lat": 48.1356, "lng": 11.5804, "address": "Hörsaal A, München", "city": "München"}'),
        (place_ids[6], 'Labor 3.14', '{"type": "coordinates", "lat": 48.1367, "lng": 11.5812, "address": "Labor 3.14, München", "city": "München"}'),
        (place_ids[7], 'Audimax', '{"type": "coordinates", "lat": 48.1378, "lng": 11.5789, "address": "Audimax, München", "city": "München"}'),
        (place_ids[8], 'Sportplatz', '{"type": "coordinates", "lat": 48.1423, "lng": 11.5701, "address": "Sportplatz, München", "city": "München"}'),
        (place_ids[9], 'Botanischer Garten', '{"type": "coordinates", "lat": 48.1167, "lng": 11.5056, "address": "Botanischer Garten, München", "city": "München"}'),
        (place_ids[10], 'Fitness Studio Campus', '{"type": "coordinates", "lat": 48.1401, "lng": 11.5734, "address": "Fitness Studio Campus, München", "city": "München"}'),
        (place_ids[11], 'Co-Working Space TUM', '{"type": "coordinates", "lat": 48.1390, "lng": 11.5825, "address": "Co-Working Space TUM, München", "city": "München"}'),
        (place_ids[12], 'Buchhandlung Uni', '{"type": "coordinates", "lat": 48.1365, "lng": 11.5798, "address": "Buchhandlung Uni, München", "city": "München"}');

    -- Note: In production, you would create auth users first using:
    -- supabase auth signup or admin API calls
    -- For now, we assume the user_ids already exist in auth.users
    
    -- Insert test profiles (only if auth users exist)
    INSERT INTO profiles (profile_id, name, studiengang, university, user_id) VALUES
        (uuid_generate_v4(), 'Max Müller', 'Informatik', 'TU München', user_ids[1]),
        (uuid_generate_v4(), 'Anna Schmidt', 'Maschinenbau', 'TU München', user_ids[2]),
        (uuid_generate_v4(), 'David Fischer', 'Elektrotechnik', 'TU München', user_ids[3]),
        (uuid_generate_v4(), 'Julia Weber', 'BWL', 'LMU München', user_ids[4]),
        (uuid_generate_v4(), 'Felix Meyer', 'Informatik', 'TU München', user_ids[5]),
        (uuid_generate_v4(), 'Laura Wagner', 'Psychologie', 'LMU München', user_ids[6]),
        (uuid_generate_v4(), 'Leon Becker', 'Jura', 'LMU München', user_ids[7]),
        (uuid_generate_v4(), 'Emma Schulz', 'Medizin', 'LMU München', user_ids[8]);

    -- Insert test activities
    INSERT INTO activities (activity_id, user_id, place_id, time) VALUES
        (uuid_generate_v4(), user_ids[1], place_ids[1], NOW() - INTERVAL '1 day'),
        (uuid_generate_v4(), user_ids[1], place_ids[2], NOW() - INTERVAL '1 day' + INTERVAL '2 hours'),
        (uuid_generate_v4(), user_ids[2], place_ids[3], NOW() - INTERVAL '2 days'),
        (uuid_generate_v4(), user_ids[2], place_ids[1], NOW() - INTERVAL '2 days' + INTERVAL '3 hours'),
        (uuid_generate_v4(), user_ids[3], place_ids[5], NOW() - INTERVAL '3 days'),
        (uuid_generate_v4(), user_ids[4], place_ids[2], NOW() - INTERVAL '1 hour'),
        (uuid_generate_v4(), user_ids[5], place_ids[6], NOW() - INTERVAL '4 hours'),
        (uuid_generate_v4(), user_ids[6], place_ids[4], NOW() - INTERVAL '6 hours'),
        (uuid_generate_v4(), user_ids[7], place_ids[9], NOW() - INTERVAL '1 day' + INTERVAL '1 hour'),
        (uuid_generate_v4(), user_ids[8], place_ids[10], NOW() - INTERVAL '2 days' + INTERVAL '30 minutes'),
        (uuid_generate_v4(), user_ids[3], place_ids[11], NOW() - INTERVAL '3 days' + INTERVAL '1 hour'),
        (uuid_generate_v4(), user_ids[4], place_ids[12], NOW() - INTERVAL '4 days');

    -- Insert test friendships
    INSERT INTO friendships (friendship_id, user1_id, user2_id) VALUES
        (uuid_generate_v4(), user_ids[1], user_ids[2]),
        (uuid_generate_v4(), user_ids[1], user_ids[5]),
        (uuid_generate_v4(), user_ids[2], user_ids[3]),
        (uuid_generate_v4(), user_ids[4], user_ids[6]),
        (uuid_generate_v4(), user_ids[5], user_ids[6]),
        (uuid_generate_v4(), user_ids[7], user_ids[8]);

    -- Insert test friendship invites
    INSERT INTO friendship_invites (invite_id, requester_id, requestee_id, status) VALUES
        (uuid_generate_v4(), user_ids[3], user_ids[4], 'pending'),
        (uuid_generate_v4(), user_ids[7], user_ids[1], 'pending'),
        (uuid_generate_v4(), user_ids[8], user_ids[5], 'rejected'),
        (uuid_generate_v4(), user_ids[2], user_ids[6], 'pending');

    RAISE NOTICE 'Test data created successfully!';
    RAISE NOTICE 'Places: %', array_length(place_ids, 1);
    RAISE NOTICE 'Users: %', array_length(user_ids, 1);
END $$;