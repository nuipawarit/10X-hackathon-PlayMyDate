#!/bin/bash

BASE_URL="http://localhost:3001/api/v1"

echo "=========================================="
echo "PlayMyDate API Test Suite"
echo "=========================================="

# 1. Register new user
echo -e "\n=== 1. AUTH: Register ==="
curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"test'$RANDOM'@test.com","password":"test123","display_name":"Tester"}' | head -c 150
echo "... OK"

# 2. Login
echo -e "\n=== 2. AUTH: Login ==="
LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@demo.com","password":"password123"}')
TOKEN=$(echo "$LOGIN" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "Token obtained: ${TOKEN:0:50}..."

# 3. Get Profile
echo -e "\n=== 3. USER: Get Profile ==="
curl -s "$BASE_URL/users/me" -H "Authorization: Bearer $TOKEN" | head -c 200
echo "... OK"

# 4. Update Profile
echo -e "\n=== 4. USER: Update Profile ==="
curl -s -X PUT "$BASE_URL/users/me/profile" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"bio":"Updated bio!","interests":["movies","music"]}' | head -c 150
echo "... OK"

# 5. Update Private Data
echo -e "\n=== 5. USER: Update Private Data ==="
curl -s -X PUT "$BASE_URL/users/me/private-data" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"real_name":"Alice Test"}' | head -c 150
echo "... OK"

# 6. Get Matches
echo -e "\n=== 6. MATCHES: Get My Matches ==="
MATCHES=$(curl -s "$BASE_URL/matches/me" -H "Authorization: Bearer $TOKEN")
echo "$MATCHES" | head -c 200
MATCH_ID=$(echo "$MATCHES" | grep -o '"match":{"id":"[^"]*"' | head -1 | cut -d'"' -f6)
echo -e "\nMatch ID: $MATCH_ID"

# 7. Get Match Detail
echo -e "\n=== 7. MATCHES: Get Match Detail ==="
curl -s "$BASE_URL/matches/$MATCH_ID" -H "Authorization: Bearer $TOKEN" | head -c 200
echo "... OK"

# 8. Get Intimacy
echo -e "\n=== 8. INTIMACY: Get Intimacy Level ==="
curl -s "$BASE_URL/intimacy/match/$MATCH_ID" -H "Authorization: Bearer $TOKEN"

# 9. Get Unlocks
echo -e "\n=== 9. INTIMACY: Get Unlocks ==="
curl -s "$BASE_URL/intimacy/match/$MATCH_ID/unlocks" -H "Authorization: Bearer $TOKEN"

# 10. Get Activities
echo -e "\n\n=== 10. ACTIVITIES: Get Available Activities ==="
ACTIVITIES=$(curl -s "$BASE_URL/activities/match/$MATCH_ID" -H "Authorization: Bearer $TOKEN")
echo "$ACTIVITIES" | head -c 300
ACTIVITY_ID=$(echo "$ACTIVITIES" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo -e "\nActivity ID: $ACTIVITY_ID"

# 11. Start Activity
echo -e "\n=== 11. ACTIVITIES: Start Activity ==="
START=$(curl -s -X POST "$BASE_URL/activities/match/$MATCH_ID/start/$ACTIVITY_ID" \
  -H "Authorization: Bearer $TOKEN")
echo "$START" | head -c 200
INSTANCE_ID=$(echo "$START" | grep -o '"instance":{"id":"[^"]*"' | cut -d'"' -f6)
echo -e "\nInstance ID: $INSTANCE_ID"

# 12. Complete Activity
echo -e "\n=== 12. ACTIVITIES: Complete Activity ==="
curl -s -X POST "$BASE_URL/activities/instance/$INSTANCE_ID/complete" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"result":{"completed":true}}'

# 13. Get Messages
echo -e "\n\n=== 13. MESSAGES: Get Messages ==="
curl -s "$BASE_URL/messages/match/$MATCH_ID" -H "Authorization: Bearer $TOKEN" | head -c 300
echo ""

# 14. Send Message
echo -e "\n=== 14. MESSAGES: Send Message ==="
curl -s -X POST "$BASE_URL/messages/match/$MATCH_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"Hello from API test!"}'

# 15. Check Intimacy After Activity
echo -e "\n\n=== 15. INTIMACY: Check After Activity ==="
curl -s "$BASE_URL/intimacy/match/$MATCH_ID" -H "Authorization: Bearer $TOKEN"

echo -e "\n\n=========================================="
echo "All tests completed!"
echo "=========================================="
