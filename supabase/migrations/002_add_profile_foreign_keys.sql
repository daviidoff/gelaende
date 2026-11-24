-- 001 already uses the default foreign-key names for references to auth.users.
-- Give the additional profile relationships their own names.
DO $$
DECLARE
    edge record;
    constraint_name text;
BEGIN
    FOR edge IN SELECT * FROM (VALUES
        ('friendships', 'user1_id'),
        ('friendships', 'user2_id'),
        ('friendship_invites', 'requester_id'),
        ('friendship_invites', 'requestee_id')
    ) AS edges(table_name, column_name)
    LOOP
        constraint_name := edge.table_name || '_' || edge.column_name || '_profile_fkey';
        EXECUTE format(
            'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%I)
             REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT VALID',
            edge.table_name, constraint_name, edge.column_name
        );
        BEGIN
            EXECUTE format('ALTER TABLE public.%I VALIDATE CONSTRAINT %I', edge.table_name, constraint_name);
        EXCEPTION WHEN foreign_key_violation THEN
            -- An installation with just 001 could have friendships before profiles.
            -- Keep those rows and enforce the constraint for all new relationships.
            RAISE NOTICE 'Backfill missing profiles before validating %.%', edge.table_name, constraint_name;
        END;
    END LOOP;
END $$;
