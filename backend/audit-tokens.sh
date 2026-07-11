#!/bin/bash
# Fetches fresh tokens and writes them to /tmp/audit-tokens.env
API=http://localhost:4000/api
PW=auditpass1234
OUT=/tmp/audit-tokens.env

login() {
  curl -s -X POST "$API/auth/login" -H "Content-Type: application/json" \
    -d "{\"email\":\"$1\",\"password\":\"$PW\"}" \
    | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])"
}

{
  echo "export API=$API"
  echo "export TOKEN_ADMIN=$(login audit-admin@test.local)"
  echo "export TOKEN_FOUNDER=$(login audit-founder@test.local)"
  echo "export TOKEN_FRONTEND=$(login audit-frontend@test.local)"
  echo "export TOKEN_BACKEND=$(login audit-backend@test.local)"
  echo "export TOKEN_DEVOPS=$(login audit-devops@test.local)"
  echo "export TOKEN_AIML=$(login audit-aiml@test.local)"
} > $OUT

wc -l $OUT
head -3 $OUT | cut -c1-70
