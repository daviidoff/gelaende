-- Create events table
CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME, -- Optional
  place VARCHAR(255) NOT NULL,
  location_details TEXT,
  max_attendees INTEGER, -- Optional
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
  category VARCHAR(100),
  is_public BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Junction table for attendees (many-to-many relationship)
CREATE TABLE event_attendees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'declined')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Junction table for organizers (many-to-many relationship)
CREATE TABLE event_organizers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'organizer' CHECK (role IN ('organizer', 'co-organizer', 'admin')),
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_organizers ENABLE ROW LEVEL SECURITY;

-- Add indexes for better performance
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_created_by ON events(created_by);
CREATE INDEX idx_events_is_public ON events(is_public);
CREATE INDEX idx_event_attendees_event_id ON event_attendees(event_id);
CREATE INDEX idx_event_attendees_user_id ON event_attendees(user_id);
CREATE INDEX idx_event_organizers_event_id ON event_organizers(event_id);
CREATE INDEX idx_event_organizers_user_id ON event_organizers(user_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Basic RLS policies
-- Events policies
CREATE POLICY "Public events are viewable by everyone" ON events
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own events" ON events
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can view events they're attending" ON events
    FOR SELECT USING (
        id IN (
            SELECT event_id FROM event_attendees 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view events they're organizing" ON events
    FOR SELECT USING (
        id IN (
            SELECT event_id FROM event_organizers 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Authenticated users can create events" ON events
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own events" ON events
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Organizers can update events" ON events
    FOR UPDATE USING (
        id IN (
            SELECT event_id FROM event_organizers 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own events" ON events
    FOR DELETE USING (auth.uid() = created_by);

-- Event attendees policies
CREATE POLICY "Users can view attendees of public events" ON event_attendees
    FOR SELECT USING (
        event_id IN (
            SELECT id FROM events WHERE is_public = true
        )
    );

CREATE POLICY "Users can view attendees of events they're part of" ON event_attendees
    FOR SELECT USING (
        user_id = auth.uid() OR 
        event_id IN (
            SELECT event_id FROM event_organizers WHERE user_id = auth.uid()
        ) OR
        event_id IN (
            SELECT id FROM events WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "Users can join events" ON event_attendees
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own attendance" ON event_attendees
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can leave events" ON event_attendees
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Organizers can manage attendees" ON event_attendees
    FOR ALL USING (
        event_id IN (
            SELECT event_id FROM event_organizers WHERE user_id = auth.uid()
        ) OR
        event_id IN (
            SELECT id FROM events WHERE created_by = auth.uid()
        )
    );

-- Event organizers policies
CREATE POLICY "Users can view organizers of public events" ON event_organizers
    FOR SELECT USING (
        event_id IN (
            SELECT id FROM events WHERE is_public = true
        )
    );

CREATE POLICY "Users can view organizers of events they're part of" ON event_organizers
    FOR SELECT USING (
        user_id = auth.uid() OR 
        event_id IN (
            SELECT event_id FROM event_organizers WHERE user_id = auth.uid()
        ) OR
        event_id IN (
            SELECT event_id FROM event_attendees WHERE user_id = auth.uid()
        ) OR
        event_id IN (
            SELECT id FROM events WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "Event creators can add organizers" ON event_organizers
    FOR INSERT WITH CHECK (
        event_id IN (
            SELECT id FROM events WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "Event creators can update organizers" ON event_organizers
    FOR UPDATE USING (
        event_id IN (
            SELECT id FROM events WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "Event creators can remove organizers" ON event_organizers
    FOR DELETE USING (
        event_id IN (
            SELECT id FROM events WHERE created_by = auth.uid()
        )
    );