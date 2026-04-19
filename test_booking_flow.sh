#!/bin/bash
# HealHive Therapist Booking Flow - Quick Test Script
# Run this after starting both backend and frontend servers

API_URL="http://localhost:8000/api"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASS="admin123"
THERAPIST_EMAIL="therapist@example.com"
THERAPIST_PASS="therapist123"
USER_EMAIL="user@example.com"
USER_PASS="user123"

echo "🔄 Starting HealHive Booking Flow Test"
echo "========================================"

# Step 1: Register Admin (if not exists)
echo ""
echo "Step 1️⃣: Register Admin"
curl -X POST "$API_URL/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$ADMIN_EMAIL\",
    \"username\": \"admin\",
    \"password\": \"$ADMIN_PASS\",
    \"full_name\": \"Admin User\",
    \"role\": \"admin\"
  }" 2>/dev/null | jq .

# Step 2: Register Therapist
echo ""
echo "Step 2️⃣: Register Therapist"
THERAPIST_RESPONSE=$(curl -s -X POST "$API_URL/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$THERAPIST_EMAIL\",
    \"username\": \"therapist\",
    \"password\": \"$THERAPIST_PASS\",
    \"full_name\": \"Dr. Jane Smith\",
    \"role\": \"therapist\",
    \"specialization\": \"Cognitive Behavioral Therapy\"
  }")
echo "$THERAPIST_RESPONSE" | jq .
THERAPIST_ID=$(echo "$THERAPIST_RESPONSE" | jq '.user.id')
echo "Created therapist with ID: $THERAPIST_ID"

# Step 3: Admin Login
echo ""
echo "Step 3️⃣: Admin Login"
ADMIN_LOGIN=$(curl -s -X POST "$API_URL/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$ADMIN_EMAIL\",
    \"password\": \"$ADMIN_PASS\"
  }")
echo "$ADMIN_LOGIN" | jq .
ADMIN_TOKEN=$(echo "$ADMIN_LOGIN" | jq -r '.token')
echo "Admin token: ${ADMIN_TOKEN:0:20}..."

# Step 4: Admin Approves Therapist
echo ""
echo "Step 4️⃣: Admin Approves Therapist"
curl -X PUT "$API_URL/therapists/$THERAPIST_ID/verify" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{
    \"action\": \"approve\"
  }" 2>/dev/null | jq .

# Step 5: Therapist Login
echo ""
echo "Step 5️⃣: Therapist Login (should succeed now)"
THERAPIST_LOGIN=$(curl -s -X POST "$API_URL/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$THERAPIST_EMAIL\",
    \"password\": \"$THERAPIST_PASS\"
  }")
echo "$THERAPIST_LOGIN" | jq .
THERAPIST_TOKEN=$(echo "$THERAPIST_LOGIN" | jq -r '.token')
echo "Therapist token: ${THERAPIST_TOKEN:0:20}..."

# Step 6: Therapist Creates Availability Slot
echo ""
echo "Step 6️⃣: Therapist Creates Availability Slot"
# Set times for today + 2 hours
START_TIME=$(date -u -d '+2 hours' +'%Y-%m-%dT%H:00:00Z' 2>/dev/null || date -u -v+2H +'%Y-%m-%dT%H:00:00Z')
END_TIME=$(date -u -d '+3 hours' +'%Y-%m-%dT%H:00:00Z' 2>/dev/null || date -u -v+3H +'%Y-%m-%dT%H:00:00Z')
echo "Creating slot: $START_TIME to $END_TIME"
AVAILABILITY=$(curl -s -X POST "$API_URL/sessions/availability/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $THERAPIST_TOKEN" \
  -d "{
    \"start_time\": \"$START_TIME\",
    \"end_time\": \"$END_TIME\"
  }")
echo "$AVAILABILITY" | jq .
SLOT_ID=$(echo "$AVAILABILITY" | jq '.availability.id' 2>/dev/null || echo "0")
echo "Created availability slot with ID: $SLOT_ID"

# Step 7: Register Regular User
echo ""
echo "Step 7️⃣: Register Regular User"
USER_REGISTER=$(curl -s -X POST "$API_URL/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$USER_EMAIL\",
    \"username\": \"user\",
    \"password\": \"$USER_PASS\",
    \"full_name\": \"John Patient\",
    \"role\": \"user\"
  }")
echo "$USER_REGISTER" | jq .

# Step 8: User Login
echo ""
echo "Step 8️⃣: User Login"
USER_LOGIN=$(curl -s -X POST "$API_URL/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$USER_EMAIL\",
    \"password\": \"$USER_PASS\"
  }")
echo "$USER_LOGIN" | jq .
USER_TOKEN=$(echo "$USER_LOGIN" | jq -r '.token')
echo "User token: ${USER_TOKEN:0:20}..."

# Step 9: User Fetches Available Therapists
echo ""
echo "Step 9️⃣: User Fetches Available Therapists"
THERAPISTS=$(curl -s -X GET "$API_URL/therapists" \
  -H "Authorization: Bearer $USER_TOKEN")
echo "$THERAPISTS" | jq .
THERAPIST_COUNT=$(echo "$THERAPISTS" | jq '.therapists | length')
echo "Found $THERAPIST_COUNT approved therapist(s)"

# Step 10: User Books a Session
echo ""
echo "Step 🔟: User Books a Session"
SESSION=$(curl -s -X POST "$API_URL/sessions/book" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d "{
    \"therapist_id\": $THERAPIST_ID,
    \"availability_id\": $SLOT_ID,
    \"session_time\": \"$START_TIME\"
  }")
echo "$SESSION" | jq .
HAS_MEETING=$(echo "$SESSION" | jq -r '.session.meeting_link' 2>/dev/null)
if [ "$HAS_MEETING" != "null" ] && [ ! -z "$HAS_MEETING" ]; then
  echo "✅ Google Meet link generated: $HAS_MEETING"
else
  echo "⚠️  No meeting link (Google Calendar integration may need setup)"
fi

echo ""
echo "========================================"
echo "✅ Test Complete!"
echo ""
echo "Check for these in the results:"
echo "✓ All therapists in steps 3-4 should show success"
echo "✓ Step 5: Therapist should be able to login"
echo "✓ Step 6: Availability slot should be created"
echo "✓ Step 9: Therapist should be visible to user"
echo "✓ Step 10: Session should be booked successfully"
