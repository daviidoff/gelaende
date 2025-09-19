-- Create tables for the gelaende application
-- This migration creates all core tables with proper relationships and security

-- Profile table
CREATE TABLE profiles (
    profile_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    studiengang VARCHAR(255),
    university VARCHAR(255),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Place table
CREATE TABLE places (
    place_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location JSONB, -- Flexible location storage (could be coordinates, address, etc.)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity table (corrected spelling from "aktivity")
CREATE TABLE activities (
    activity_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    place_id UUID REFERENCES places(place_id) ON DELETE CASCADE NOT NULL,
    time TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Friendship table
CREATE TABLE friendships (
    friendship_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user1_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    user2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Ensure users can't be friends with themselves
    CONSTRAINT different_users CHECK (user1_id != user2_id)
);

-- Friendship invite table
CREATE TABLE friendship_invites (
    invite_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    requestee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Ensure users can't invite themselves
    CONSTRAINT different_users_invite CHECK (requester_id != requestee_id),
    -- Ensure unique pending invites between users
    CONSTRAINT unique_pending_invite UNIQUE (requester_id, requestee_id)
);

-- Create indexes for better performance
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_activities_user_id ON activities(user_id);
CREATE INDEX idx_activities_place_id ON activities(place_id);
CREATE INDEX idx_activities_time ON activities(time);
CREATE INDEX idx_friendships_user1 ON friendships(user1_id);
CREATE INDEX idx_friendships_user2 ON friendships(user2_id);
CREATE INDEX idx_friendship_invites_requester ON friendship_invites(requester_id);
CREATE INDEX idx_friendship_invites_requestee ON friendship_invites(requestee_id);
CREATE INDEX idx_friendship_invites_status ON friendship_invites(status);

-- Create unique index to prevent duplicate friendships (regardless of order)
CREATE UNIQUE INDEX idx_unique_friendship_pair ON friendships 
    (LEAST(user1_id, user2_id), GREATEST(user1_id, user2_id));

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE places ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendship_invites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile" ON profiles
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for places
CREATE POLICY "Users can view all places" ON places
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create places" ON places
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- RLS Policies for activities
CREATE POLICY "Users can view all activities" ON activities
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own activities" ON activities
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activities" ON activities
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activities" ON activities
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for friendships
CREATE POLICY "Users can view friendships they're part of" ON friendships
    FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create friendships for themselves" ON friendships
    FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can delete friendships they're part of" ON friendships
    FOR DELETE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- RLS Policies for friendship invites
CREATE POLICY "Users can view invites they sent or received" ON friendship_invites
    FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = requestee_id);

CREATE POLICY "Users can create invites as requester" ON friendship_invites
    FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update invites they received" ON friendship_invites
    FOR UPDATE USING (auth.uid() = requestee_id);

CREATE POLICY "Users can delete invites they sent or received" ON friendship_invites
    FOR DELETE USING (auth.uid() = requester_id OR auth.uid() = requestee_id);

-- Create functions for automatic updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_places_updated_at BEFORE UPDATE ON places
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_friendship_invites_updated_at BEFORE UPDATE ON friendship_invites
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();