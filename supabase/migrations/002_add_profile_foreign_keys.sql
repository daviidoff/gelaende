-- Add foreign key relationships between friendship tables and profiles
-- This fixes the PGRST200 error where Supabase couldn't find the expected relationships

-- First, let's add the foreign key constraints that the Supabase queries expect
-- We need to create foreign keys from friendships to profiles based on user_id relationships

-- Add foreign key constraint for friendships.user1_id -> profiles.user_id
ALTER TABLE friendships 
ADD CONSTRAINT friendships_user1_id_fkey 
FOREIGN KEY (user1_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

-- Add foreign key constraint for friendships.user2_id -> profiles.user_id  
ALTER TABLE friendships 
ADD CONSTRAINT friendships_user2_id_fkey 
FOREIGN KEY (user2_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

-- Add foreign key constraint for friendship_invites.requester_id -> profiles.user_id
ALTER TABLE friendship_invites 
ADD CONSTRAINT friendship_invites_requester_id_fkey 
FOREIGN KEY (requester_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

-- Add foreign key constraint for friendship_invites.requestee_id -> profiles.user_id
ALTER TABLE friendship_invites 
ADD CONSTRAINT friendship_invites_requestee_id_fkey 
FOREIGN KEY (requestee_id) REFERENCES profiles(user_id) ON DELETE CASCADE;