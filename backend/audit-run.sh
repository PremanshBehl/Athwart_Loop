#!/bin/bash
# Audit test harness. Populates $TOKEN_<ROLE> vars from login.
set -e
API=http://localhost:4000/api
PW=auditpass1234

login() {
  local email=$1
  curl -s -X POST "$API/auth/login" -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"$PW\"}" \
    | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])"
}

export TOKEN_ADMIN=$(login audit-admin@test.local)
export TOKEN_FOUNDER=$(login audit-founder@test.local)
export TOKEN_FRONTEND=$(login audit-frontend@test.local)
export TOKEN_BACKEND=$(login audit-backend@test.local)
export TOKEN_DEVOPS=$(login audit-devops@test.local)
export TOKEN_AIML=$(login audit-aiml@test.local)

echo "ADMIN    $TOKEN_ADMIN" | cut -c1-70
echo "FOUNDER  $TOKEN_FOUNDER" | cut -c1-70
echo "FRONTEND $TOKEN_FRONTEND" | cut -c1-70
