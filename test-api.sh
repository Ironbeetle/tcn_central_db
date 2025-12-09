#!/bin/bash

# API Test Script for TCN Central DB
BASE_URL="http://localhost:3000/api/v1"
API_KEY="test"

echo "Testing TCN Central DB API..."
echo "================================"

echo -e "\n1. Testing Communities endpoint:"
curl -s -H "x-api-key: $API_KEY" "$BASE_URL/communities" | jq -r '.data[] | "- \(.name): \(.member_count) members"'

echo -e "\n2. Testing Stats endpoint:"
curl -s -H "x-api-key: $API_KEY" "$BASE_URL/stats" | jq -r '.data | "Total Members: \(.total_members), Active: \(.active_members)"'

echo -e "\n3. Testing Members list (first 3):"
curl -s -H "x-api-key: $API_KEY" "$BASE_URL/members?limit=3" | jq -r '.data[] | "- \(.personal_info.first_name) \(.personal_info.last_name) (\(.personal_info.t_number))"'

echo -e "\n4. Testing single member (first ID):"
MEMBER_ID=$(curl -s -H "x-api-key: $API_KEY" "$BASE_URL/members?limit=1" | jq -r '.data[0].id')
if [ "$MEMBER_ID" != "null" ] && [ -n "$MEMBER_ID" ]; then
  echo "Member ID: $MEMBER_ID"
  curl -s -H "x-api-key: $API_KEY" "$BASE_URL/members/$MEMBER_ID" | jq -r '.data.personal_info | "Name: \(.first_name) \(.last_name), Community: \(.contact_info.community // "N/A")"'
else
  echo "No members found in database"
fi

echo -e "\nAPI testing complete!"