// Database types generated from Supabase schema
// These types correspond to the tables created in the initial migration

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          profile_id: string;
          name: string;
          studiengang: string | null;
          university: string | null;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          profile_id?: string;
          name: string;
          studiengang?: string | null;
          university?: string | null;
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          profile_id?: string;
          name?: string;
          studiengang?: string | null;
          university?: string | null;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      places: {
        Row: {
          place_id: string;
          name: string;
          location: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          place_id?: string;
          name: string;
          location?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          place_id?: string;
          name?: string;
          location?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      activities: {
        Row: {
          activity_id: string;
          user_id: string;
          place_id: string;
          time: string;
          picture: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          activity_id?: string;
          user_id: string;
          place_id: string;
          time: string;
          picture?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          activity_id?: string;
          user_id?: string;
          place_id?: string;
          time?: string;
          picture?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      friendships: {
        Row: {
          friendship_id: string;
          user1_id: string;
          user2_id: string;
          created_at: string;
        };
        Insert: {
          friendship_id?: string;
          user1_id: string;
          user2_id: string;
          created_at?: string;
        };
        Update: {
          friendship_id?: string;
          user1_id?: string;
          user2_id?: string;
          created_at?: string;
        };
      };
      friendship_invites: {
        Row: {
          invite_id: string;
          requester_id: string;
          requestee_id: string;
          status: "pending" | "accepted" | "rejected";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          invite_id?: string;
          requester_id: string;
          requestee_id: string;
          status?: "pending" | "accepted" | "rejected";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          invite_id?: string;
          requester_id?: string;
          requestee_id?: string;
          status?: "pending" | "accepted" | "rejected";
          created_at?: string;
          updated_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          date: string;
          start_time: string | null;
          end_time: string | null;
          place: string;
          location_details: string | null;
          max_attendees: number | null;
          status: "draft" | "published" | "cancelled" | "completed";
          category: string | null;
          is_public: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          date: string;
          start_time?: string | null;
          end_time?: string | null;
          place: string;
          location_details?: string | null;
          max_attendees?: number | null;
          status?: "draft" | "published" | "cancelled" | "completed";
          category?: string | null;
          is_public?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          date?: string;
          start_time?: string | null;
          end_time?: string | null;
          place?: string;
          location_details?: string | null;
          max_attendees?: number | null;
          status?: "draft" | "published" | "cancelled" | "completed";
          category?: string | null;
          is_public?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      event_attendees: {
        Row: {
          id: string;
          event_id: string;
          user_id: string;
          status: "pending" | "confirmed" | "declined";
          joined_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          user_id: string;
          status?: "pending" | "confirmed" | "declined";
          joined_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          user_id?: string;
          status?: "pending" | "confirmed" | "declined";
          joined_at?: string;
        };
      };
      event_organizers: {
        Row: {
          id: string;
          event_id: string;
          user_id: string;
          role: "organizer" | "co-organizer" | "admin";
          added_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          user_id: string;
          role?: "organizer" | "co-organizer" | "admin";
          added_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          user_id?: string;
          role?: "organizer" | "co-organizer" | "admin";
          added_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Helper type for JSON fields
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Convenience types for easier usage
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export type Place = Database["public"]["Tables"]["places"]["Row"];
export type PlaceInsert = Database["public"]["Tables"]["places"]["Insert"];
export type PlaceUpdate = Database["public"]["Tables"]["places"]["Update"];

export type Activity = Database["public"]["Tables"]["activities"]["Row"];
export type ActivityInsert =
  Database["public"]["Tables"]["activities"]["Insert"];
export type ActivityUpdate =
  Database["public"]["Tables"]["activities"]["Update"];

export type Friendship = Database["public"]["Tables"]["friendships"]["Row"];
export type FriendshipInsert =
  Database["public"]["Tables"]["friendships"]["Insert"];
export type FriendshipUpdate =
  Database["public"]["Tables"]["friendships"]["Update"];

export type FriendshipInvite =
  Database["public"]["Tables"]["friendship_invites"]["Row"];
export type FriendshipInviteInsert =
  Database["public"]["Tables"]["friendship_invites"]["Insert"];
export type FriendshipInviteUpdate =
  Database["public"]["Tables"]["friendship_invites"]["Update"];

export type Event = Database["public"]["Tables"]["events"]["Row"];
export type EventInsert = Database["public"]["Tables"]["events"]["Insert"];
export type EventUpdate = Database["public"]["Tables"]["events"]["Update"];

export type EventAttendee =
  Database["public"]["Tables"]["event_attendees"]["Row"];
export type EventAttendeeInsert =
  Database["public"]["Tables"]["event_attendees"]["Insert"];
export type EventAttendeeUpdate =
  Database["public"]["Tables"]["event_attendees"]["Update"];

export type EventOrganizer =
  Database["public"]["Tables"]["event_organizers"]["Row"];
export type EventOrganizerInsert =
  Database["public"]["Tables"]["event_organizers"]["Insert"];
export type EventOrganizerUpdate =
  Database["public"]["Tables"]["event_organizers"]["Update"];

// Extended types with relationships
export type ProfileWithUser = Profile & {
  user?: {
    id: string;
    email?: string;
  };
};

export type ActivityWithDetails = Activity & {
  place?: Place;
  profile?: Profile;
};

export type FriendshipWithProfiles = Friendship & {
  user1_profile?: Profile;
  user2_profile?: Profile;
};

export type FriendshipInviteWithProfiles = FriendshipInvite & {
  requester_profile?: Profile;
  requestee_profile?: Profile;
};

// Extended event types with relationships
export type EventWithDetails = Event & {
  creator_profile?: Profile;
  attendees?: (EventAttendee & { profile?: Profile })[];
  organizers?: (EventOrganizer & { profile?: Profile })[];
  attendee_count?: number;
  is_attending?: boolean;
  is_organizing?: boolean;
};

export type EventAttendeeWithProfile = EventAttendee & {
  profile?: Profile;
  event?: Event;
};

export type EventOrganizerWithProfile = EventOrganizer & {
  profile?: Profile;
  event?: Event;
};

// Location types for the places table
export interface LocationCoordinates {
  lat: number;
  lng: number;
  address?: string;
}

export interface LocationAddress {
  street?: string;
  city?: string;
  country?: string;
  postal_code?: string;
  coordinates?: LocationCoordinates;
}

export type LocationData = LocationCoordinates | LocationAddress;

// Event-related enums and utility types
export type EventStatus = "draft" | "published" | "cancelled" | "completed";
export type AttendeeStatus = "pending" | "confirmed" | "declined";
export type OrganizerRole = "organizer" | "co-organizer" | "admin";

// Event creation form types
export interface EventFormData {
  title: string;
  description?: string;
  date: string;
  start_time?: string;
  end_time?: string;
  place: string;
  location_details?: string;
  max_attendees?: number;
  category?: string;
  is_public?: boolean;
}

// Event filters and search types
export interface EventFilters {
  status?: EventStatus[];
  category?: string[];
  date_from?: string;
  date_to?: string;
  is_public?: boolean;
  created_by?: string;
  attending?: boolean;
  organizing?: boolean;
}

// Event statistics types
export interface EventStats {
  total_attendees: number;
  confirmed_attendees: number;
  pending_attendees: number;
  declined_attendees: number;
  total_organizers: number;
}
