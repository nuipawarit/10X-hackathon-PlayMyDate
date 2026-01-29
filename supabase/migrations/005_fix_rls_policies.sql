-- Fix infinite recursion in RLS policies
-- Drop existing policies and recreate with proper logic

-- Drop existing profiles policies
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select_matched" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;

-- Recreate profiles policies without recursion
CREATE POLICY "profiles_select_own"
ON profiles FOR SELECT
TO authenticated
USING (auth_id = auth.uid());

CREATE POLICY "profiles_update_own"
ON profiles FOR UPDATE
TO authenticated
USING (auth_id = auth.uid())
WITH CHECK (auth_id = auth.uid());

CREATE POLICY "profiles_insert_own"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth_id = auth.uid());

-- Create a function to get current user's profile id
CREATE OR REPLACE FUNCTION get_my_profile_id()
RETURNS UUID AS $$
  SELECT id FROM profiles WHERE auth_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Policy for viewing matched profiles
CREATE POLICY "profiles_select_matched"
ON profiles FOR SELECT
TO authenticated
USING (
    id IN (
        SELECT user2_id FROM matches
        WHERE user1_id = get_my_profile_id()
        AND status = 'matched'
        UNION
        SELECT user1_id FROM matches
        WHERE user2_id = get_my_profile_id()
        AND status = 'matched'
    )
);

-- Fix matches policies
DROP POLICY IF EXISTS "matches_select_own" ON matches;
DROP POLICY IF EXISTS "matches_insert" ON matches;
DROP POLICY IF EXISTS "matches_update_own" ON matches;

CREATE POLICY "matches_select_own"
ON matches FOR SELECT
TO authenticated
USING (
    user1_id = get_my_profile_id()
    OR user2_id = get_my_profile_id()
);

CREATE POLICY "matches_insert"
ON matches FOR INSERT
TO authenticated
WITH CHECK (
    user1_id = get_my_profile_id()
    OR user2_id = get_my_profile_id()
);

CREATE POLICY "matches_update_own"
ON matches FOR UPDATE
TO authenticated
USING (
    user1_id = get_my_profile_id()
    OR user2_id = get_my_profile_id()
);

-- Fix messages policies
DROP POLICY IF EXISTS "messages_select_own" ON messages;
DROP POLICY IF EXISTS "messages_insert_own" ON messages;
DROP POLICY IF EXISTS "messages_update_own" ON messages;

CREATE POLICY "messages_select_own"
ON messages FOR SELECT
TO authenticated
USING (
    match_id IN (
        SELECT id FROM matches
        WHERE user1_id = get_my_profile_id()
           OR user2_id = get_my_profile_id()
    )
);

CREATE POLICY "messages_insert_own"
ON messages FOR INSERT
TO authenticated
WITH CHECK (
    sender_id = get_my_profile_id()
    AND match_id IN (
        SELECT id FROM matches
        WHERE status = 'matched'
        AND (user1_id = get_my_profile_id()
             OR user2_id = get_my_profile_id())
    )
);

CREATE POLICY "messages_update_own"
ON messages FOR UPDATE
TO authenticated
USING (
    match_id IN (
        SELECT id FROM matches
        WHERE user1_id = get_my_profile_id()
           OR user2_id = get_my_profile_id()
    )
);

-- Fix activity_instances policies
DROP POLICY IF EXISTS "activity_instances_select_own" ON activity_instances;
DROP POLICY IF EXISTS "activity_instances_insert_own" ON activity_instances;
DROP POLICY IF EXISTS "activity_instances_update_own" ON activity_instances;

CREATE POLICY "activity_instances_select_own"
ON activity_instances FOR SELECT
TO authenticated
USING (
    match_id IN (
        SELECT id FROM matches
        WHERE user1_id = get_my_profile_id()
           OR user2_id = get_my_profile_id()
    )
);

CREATE POLICY "activity_instances_insert_own"
ON activity_instances FOR INSERT
TO authenticated
WITH CHECK (
    match_id IN (
        SELECT id FROM matches
        WHERE status = 'matched'
        AND (user1_id = get_my_profile_id()
             OR user2_id = get_my_profile_id())
    )
);

CREATE POLICY "activity_instances_update_own"
ON activity_instances FOR UPDATE
TO authenticated
USING (
    match_id IN (
        SELECT id FROM matches
        WHERE user1_id = get_my_profile_id()
           OR user2_id = get_my_profile_id()
    )
);

-- Fix intimacy_scores policies
DROP POLICY IF EXISTS "intimacy_scores_select_own" ON intimacy_scores;
DROP POLICY IF EXISTS "intimacy_scores_update_own" ON intimacy_scores;
DROP POLICY IF EXISTS "intimacy_scores_insert" ON intimacy_scores;

CREATE POLICY "intimacy_scores_select_own"
ON intimacy_scores FOR SELECT
TO authenticated
USING (
    match_id IN (
        SELECT id FROM matches
        WHERE user1_id = get_my_profile_id()
           OR user2_id = get_my_profile_id()
    )
);

CREATE POLICY "intimacy_scores_update_own"
ON intimacy_scores FOR UPDATE
TO authenticated
USING (
    match_id IN (
        SELECT id FROM matches
        WHERE user1_id = get_my_profile_id()
           OR user2_id = get_my_profile_id()
    )
);

CREATE POLICY "intimacy_scores_insert"
ON intimacy_scores FOR INSERT
TO authenticated
WITH CHECK (
    match_id IN (
        SELECT id FROM matches
        WHERE user1_id = get_my_profile_id()
           OR user2_id = get_my_profile_id()
    )
);
