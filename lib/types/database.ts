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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          activity_id?: string;
          user_id: string;
          place_id: string;
          time: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          activity_id?: string;
          user_id?: string;
          place_id?: string;
          time?: string;
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
