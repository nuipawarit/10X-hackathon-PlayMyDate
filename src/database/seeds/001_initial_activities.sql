-- Seed initial activity templates

INSERT INTO activities (name, type, description, instructions, intimacy_points, config) VALUES
(
    'Two Truths One Lie',
    'icebreaker',
    'Share two true facts and one lie about yourself. Your partner guesses which is the lie!',
    '1. Each person writes 3 statements about themselves - 2 true, 1 false
2. Take turns guessing which statement is the lie
3. Reveal the answer and discuss!',
    15,
    '{"rounds": 2, "statements_per_round": 3}'
),
(
    'Question Exchange',
    'conversation',
    'Take turns asking each other interesting questions to learn more about your partner.',
    '1. Start with the provided questions or create your own
2. Take turns answering honestly
3. Feel free to ask follow-up questions!',
    10,
    '{"questions": ["What''s your favorite way to spend a weekend?", "If you could travel anywhere, where would you go?", "What''s a skill you''d love to learn?", "What''s your comfort food?", "What''s the best advice you''ve ever received?"]}'
),
(
    'Food Preference Quiz',
    'quiz',
    'Discover your food compatibility! Answer questions about your food preferences.',
    '1. Both partners answer the same food-related questions
2. See how many answers match
3. Discuss your differences and find common ground!',
    12,
    '{"questions": [{"q": "Sweet or Savory?", "options": ["Sweet", "Savory", "Both equally"]}, {"q": "Spicy food?", "options": ["Love it!", "Medium is fine", "No spice please"]}, {"q": "Coffee or Tea?", "options": ["Coffee", "Tea", "Both", "Neither"]}, {"q": "Breakfast type?", "options": ["Big breakfast", "Light breakfast", "Skip it"]}]}'
),
(
    'Would You Rather',
    'game',
    'Fun dilemmas to spark interesting conversations and learn about each other''s preferences.',
    '1. Take turns asking "Would you rather..." questions
2. Both must answer before moving to the next question
3. Explain your reasoning!',
    10,
    '{"questions": ["Would you rather travel to the past or the future?", "Would you rather have unlimited money or unlimited time?", "Would you rather be able to fly or be invisible?", "Would you rather live in a big city or countryside?", "Would you rather always be early or always be fashionably late?"]}'
),
(
    'Dream Date Planner',
    'creative',
    'Plan your perfect hypothetical date together! Get creative and see how compatible your ideas are.',
    '1. Together, plan a fantasy date with no budget limits
2. Decide on: Location, Activity, Food, Time of day
3. Combine your ideas into the ultimate date!',
    20,
    '{"categories": ["location", "activity", "food", "time", "special_touch"]}'
);
