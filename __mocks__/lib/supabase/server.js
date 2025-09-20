import { mockSupabaseClient } from "@supabase/ssr";

export const createClient = jest.fn(() => Promise.resolve(mockSupabaseClient));
