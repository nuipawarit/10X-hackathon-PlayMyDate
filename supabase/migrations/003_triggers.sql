-- Database Triggers for PlayMyDate

-- ============================================
-- Auto-create profile when user signs up
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (auth_id, email, display_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- Add intimacy points when message is sent
-- ============================================
CREATE OR REPLACE FUNCTION add_message_intimacy_points()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE intimacy_scores
    SET score = LEAST(score + 0.5, 100)
    WHERE match_id = NEW.match_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_message_insert
    AFTER INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION add_message_intimacy_points();

-- ============================================
-- Auto-create intimacy score when match is created
-- ============================================
CREATE OR REPLACE FUNCTION create_intimacy_score_for_match()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO intimacy_scores (match_id, score, unlocks)
    VALUES (NEW.id, 0, '[]');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_match_created
    AFTER INSERT ON matches
    FOR EACH ROW EXECUTE FUNCTION create_intimacy_score_for_match();

-- ============================================
-- Add intimacy points when activity is completed
-- ============================================
CREATE OR REPLACE FUNCTION add_activity_intimacy_points()
RETURNS TRIGGER AS $$
DECLARE
    activity_points INTEGER;
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        SELECT intimacy_points INTO activity_points
        FROM activities
        WHERE id = NEW.activity_id;

        UPDATE intimacy_scores
        SET score = LEAST(score + COALESCE(activity_points, 10), 100)
        WHERE match_id = NEW.match_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_activity_completed
    AFTER UPDATE ON activity_instances
    FOR EACH ROW EXECUTE FUNCTION add_activity_intimacy_points();

-- ============================================
-- Enable Realtime for messages table
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
