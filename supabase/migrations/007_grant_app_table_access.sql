-- Supabase projects can start with no table grants for the Data API.
-- The app accesses these tables after sign-in. Row-level policies still apply.
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.places, public.event_organizers TO authenticated;
GRANT SELECT, INSERT ON public.friendships, public.events TO authenticated;
GRANT SELECT, INSERT, UPDATE
    ON public.profiles, public.activities, public.friendship_invites
    TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_attendees TO authenticated;
