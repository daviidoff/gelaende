-- The app embeds profiles using these two PostgREST constraint names. In 004
-- they refer to auth.users, but some installations already corrected the joins.
DO $$
DECLARE
    edge record;
    source_table regclass;
    hint_name text;
    auth_key_name text;
    auth_key_oid oid;
    profile_key_name text;
BEGIN
    FOR edge IN SELECT * FROM (VALUES
        ('events', 'created_by', 'SET NULL'),
        ('event_attendees', 'user_id', 'CASCADE')
    ) AS edges(table_name, column_name, delete_action)
    LOOP
        source_table := format('public.%I', edge.table_name)::regclass;
        hint_name := edge.table_name || '_' || edge.column_name || '_fkey';
        SELECT oid INTO auth_key_oid FROM pg_constraint
        WHERE conrelid = source_table
          AND conname = hint_name AND confrelid = 'auth.users'::regclass;

        IF auth_key_oid IS NOT NULL THEN
            auth_key_name := edge.table_name || '_' || edge.column_name || '_auth_fkey';
            IF EXISTS (SELECT FROM pg_constraint WHERE conrelid = source_table
                       AND conname = auth_key_name) THEN
                auth_key_name := auth_key_name || '_' || auth_key_oid;
            END IF;
            EXECUTE format('ALTER TABLE public.%I RENAME CONSTRAINT %I TO %I', edge.table_name, hint_name, auth_key_name);
        END IF;

        -- Reuse a manual FK on the same column pair, preferring the expected name.
        SELECT c.conname INTO profile_key_name FROM pg_constraint c
        JOIN pg_attribute src ON src.attrelid = c.conrelid AND ARRAY[src.attnum] = c.conkey
        JOIN pg_attribute dst ON dst.attrelid = c.confrelid AND ARRAY[dst.attnum] = c.confkey
        WHERE c.contype = 'f' AND c.conrelid = source_table
          AND src.attname = edge.column_name
          AND c.confrelid = 'public.profiles'::regclass AND dst.attname = 'user_id'
        ORDER BY (c.conname = hint_name) DESC, c.oid LIMIT 1;

        IF profile_key_name IS NULL THEN
            EXECUTE format(
                'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%I)
                 REFERENCES public.profiles(user_id) ON DELETE %s NOT VALID',
                edge.table_name, hint_name, edge.column_name, edge.delete_action
            );
        ELSIF profile_key_name <> hint_name THEN
            EXECUTE format('ALTER TABLE public.%I RENAME CONSTRAINT %I TO %I', edge.table_name, profile_key_name, hint_name);
        END IF;

        -- Old events can predate their users' profiles. Keep those rows, while
        -- enforcing the relationship on new rows and validating clean installs.
        BEGIN
            EXECUTE format('ALTER TABLE public.%I VALIDATE CONSTRAINT %I', edge.table_name, hint_name);
        EXCEPTION WHEN foreign_key_violation THEN
            RAISE NOTICE 'Backfill missing profiles before validating %.%', edge.table_name, hint_name;
        END;
    END LOOP;
END $$;
