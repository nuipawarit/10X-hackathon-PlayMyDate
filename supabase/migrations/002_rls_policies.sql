-- Row Level Security Policies for PlayMyDate

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE intimacy_scores ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES Policies
-- ============================================

-- Users can view their own profile
CREATE POLICY "profiles_select_own"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = auth_id);

-- Users can view profiles of matched users (public data only handled in app)
CREATE POLICY "profiles_select_matched"
ON profiles FOR SELECT
TO authenticated
USING (
    id IN (
        SELECT user2_id FROM matches
        WHERE user1_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
        AND status = 'matched'
        UNION
        SELECT user1_id FROM matches
        WHERE user2_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
        AND status = 'matched'
    )
);

-- Users can update their own profile
CREATE POLICY "profiles_update_own"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = auth_id)
WITH CHECK (auth.uid() = auth_id);

-- Allow insert during signup (handled by trigger)
CREATE POLICY "profiles_insert_own"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = auth_id);

-- ============================================
-- MATCHES Policies
-- ============================================

-- Users can view their own matches
CREATE POLICY "matches_select_own"
ON matches FOR SELECT
TO authenticated
USING (
    user1_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    OR user2_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
);

-- Users can insert matches (via Edge Function with service role)
CREATE POLICY "matches_insert"
ON matches FOR INSERT
TO authenticated
WITH CHECK (
    user1_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    OR user2_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
);

-- Users can update their own matches (status changes)
CREATE POLICY "matches_update_own"
ON matches FOR UPDATE
TO authenticated
USING (
    user1_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    OR user2_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
);

-- ============================================
-- ACTIVITIES Policies
-- ============================================

-- All authenticated users can view activities (read-only templates)
CREATE POLICY "activities_select_all"
ON activities FOR SELECT
TO authenticated
USING (true);

-- ============================================
-- ACTIVITY_INSTANCES Policies
-- ============================================

-- Users can view activity instances in their matches
CREATE POLICY "activity_instances_select_own"
ON activity_instances FOR SELECT
TO authenticated
USING (
    match_id IN (
        SELECT id FROM matches
        WHERE user1_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
           OR user2_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    )
);

-- Users can create activity instances in their matches
CREATE POLICY "activity_instances_insert_own"
ON activity_instances FOR INSERT
TO authenticated
WITH CHECK (
    match_id IN (
        SELECT id FROM matches
        WHERE status = 'matched'
        AND (user1_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
             OR user2_id = (SELECT id FROM profiles WHERE auth_id = auth.uid()))
    )
);

-- Users can update activity instances in their matches
CREATE POLICY "activity_instances_update_own"
ON activity_instances FOR UPDATE
TO authenticated
USING (
    match_id IN (
        SELECT id FROM matches
        WHERE user1_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
           OR user2_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    )
);

-- ============================================
-- MESSAGES Policies
-- ============================================

-- Users can view messages in their matches
CREATE POLICY "messages_select_own"
ON messages FOR SELECT
TO authenticated
USING (
    match_id IN (
        SELECT id FROM matches
        WHERE user1_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
           OR user2_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    )
);

-- Users can send messages in their active matches
CREATE POLICY "messages_insert_own"
ON messages FOR INSERT
TO authenticated
WITH CHECK (
    sender_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    AND match_id IN (
        SELECT id FROM matches
        WHERE status = 'matched'
        AND (user1_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
             OR user2_id = (SELECT id FROM profiles WHERE auth_id = auth.uid()))
    )
);

-- Users can update messages (mark as read)
CREATE POLICY "messages_update_own"
ON messages FOR UPDATE
TO authenticated
USING (
    match_id IN (
        SELECT id FROM matches
        WHERE user1_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
           OR user2_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    )
);

-- ============================================
-- INTIMACY_SCORES Policies
-- ============================================

-- Users can view intimacy scores for their matches
CREATE POLICY "intimacy_scores_select_own"
ON intimacy_scores FOR SELECT
TO authenticated
USING (
    match_id IN (
        SELECT id FROM matches
        WHERE user1_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
           OR user2_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    )
);

-- Users can update intimacy scores (via Edge Function with service role for most cases)
CREATE POLICY "intimacy_scores_update_own"
ON intimacy_scores FOR UPDATE
TO authenticated
USING (
    match_id IN (
        SELECT id FROM matches
        WHERE user1_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
           OR user2_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    )
);

-- Insert handled by Edge Functions
CREATE POLICY "intimacy_scores_insert"
ON intimacy_scores FOR INSERT
TO authenticated
WITH CHECK (
    match_id IN (
        SELECT id FROM matches
        WHERE user1_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
           OR user2_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    )
);
