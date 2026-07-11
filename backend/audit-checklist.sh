#!/bin/bash
# Athwart Loop audit checklist — live tests
# Runs every check from the prompt sections 1-5. Prints PASS/FAIL per test.
source /tmp/audit-tokens.env
set +e

PASS=0; FAIL=0
declare -a FAILS

check() {
  local name="$1"; local expected="$2"; local got="$3"; local extra="$4"
  if [ "$got" = "$expected" ]; then
    PASS=$((PASS+1)); echo "  PASS  $name"
  else
    FAIL=$((FAIL+1)); echo "  FAIL  $name  (expected=$expected got=$got) $extra"
    FAILS+=("$name")
  fi
}

echo
echo "==== SECTION 1 · SECURITY ===="

echo
echo "-- 1.1 Registration cannot escalate to FOUNDER --"
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST $API/auth/register -H "Content-Type: application/json" \
  -d '{"email":"esc1@t.co","password":"password12","name":"Esc One","role":"FOUNDER"}')
check "public register with role=FOUNDER is rejected" 400 "$CODE"

echo
echo "-- 1.2 Passwords hashed and never in responses --"
ME=$(curl -s -H "Authorization: Bearer $TOKEN_FRONTEND" $API/auth/me)
HAS_HASH=$(echo "$ME" | python3 -c "import sys,json; d=json.load(sys.stdin); print('yes' if 'passwordHash' in json.dumps(d) else 'no')")
check "/auth/me does not return passwordHash" no "$HAS_HASH"

echo
echo "-- 1.3 JWT expiry present and enforceable --"
EXP=$(echo "$TOKEN_FRONTEND" | cut -d. -f2 | python3 -c "
import sys, base64, json
tok = sys.stdin.read().strip()
tok += '=' * (-len(tok) % 4)
p = json.loads(base64.urlsafe_b64decode(tok))
print('has_exp' if 'exp' in p else 'no_exp')")
check "JWT has exp claim" has_exp "$EXP"
# Tamper a token: change payload and try to use it
TAMPERED="${TOKEN_FRONTEND%.*}.forged"
CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TAMPERED" $API/auth/me)
check "tampered token rejected" 401 "$CODE"

echo
echo "-- 1.4 Server-side authorization on privileged ops --"
# Frontend user tries to hit admin-only endpoints directly
CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN_FRONTEND" $API/admin/section-owners)
check "FRONTEND cannot list section owners (admin/founder only)" 403 "$CODE"
CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN_FRONTEND" $API/posts/sla-health)
check "FRONTEND cannot see SLA health" 403 "$CODE"
# Unauthenticated
CODE=$(curl -s -o /dev/null -w "%{http_code}" $API/posts?limit=1)
check "unauthenticated feed request rejected" 401 "$CODE"

echo
echo "-- 1.5 Input validation on updateProfile --"
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH -H "Authorization: Bearer $TOKEN_FRONTEND" \
  -H "Content-Type: application/json" -d '{"role":"FOUNDER"}' $API/auth/me)
check "PATCH /auth/me rejects role field" 400 "$CODE"
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH -H "Authorization: Bearer $TOKEN_FRONTEND" \
  -H "Content-Type: application/json" -d "{\"bio\":\"$(python3 -c 'print("x"*10000)')\"}" $API/auth/me)
check "PATCH /auth/me rejects oversized bio" 400 "$CODE"

echo
echo "-- 1.6 CORS: wildcard rejected in cross-origin --"
# Simulate a disallowed origin
ORIGIN_HEADER=$(curl -s -o /dev/null -D - -H "Origin: https://evil.com" $API/health | grep -i "access-control-allow-origin" | tr -d '\r' | awk '{print $2}')
check "no wildcard ACL-origin for evil.com" "" "$ORIGIN_HEADER"
ORIGIN_HEADER=$(curl -s -o /dev/null -D - -H "Origin: http://localhost:5173" $API/health | grep -i "access-control-allow-origin" | tr -d '\r' | awk '{print $2}')
check "localhost:5173 permitted" "http://localhost:5173" "$ORIGIN_HEADER"

echo
echo "==== SECTION 2 · BUSINESS RULES ===="

# Helper: create a post as a role.  Args: token type section
create_post() {
  local token="$1"; local type="$2"; local section="$3"; local title="$4"
  curl -s -X POST $API/posts -H "Authorization: Bearer $token" -H "Content-Type: application/json" \
    -d "{\"title\":\"$title\",\"description\":\"desc\",\"type\":\"$type\",\"section\":\"$section\"}" \
    | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('id','ERR'))"
}

echo
echo "-- 2.1 Section routing: post assigned to section owner (or Founder fallback) --"
POST_ID=$(create_post "$TOKEN_FRONTEND" "QUESTION" "GENERAL" "Q by frontend for general")
OWNER=$(curl -s -H "Authorization: Bearer $TOKEN_FRONTEND" $API/posts/$POST_ID | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['data'].get('owner',{}).get('role','none'))")
# GENERAL has no assigned section owner in our seed → falls back to FOUNDER
check "post in GENERAL owned by FOUNDER (fallback)" FOUNDER "$OWNER"

echo
echo "-- 2.2 Resolve permission rules --"
# Backend user tries to resolve a QUESTION they didn't own or author → should fail
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH $API/posts/$POST_ID/status \
  -H "Authorization: Bearer $TOKEN_BACKEND" -H "Content-Type: application/json" \
  -d '{"status":"RESOLVED","resolution":"ANSWERED"}')
check "non-owner non-author cannot fast-close QUESTION" 403 "$CODE"

# Author (FRONTEND) fast-closes their own QUESTION with ANSWERED → should succeed
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH $API/posts/$POST_ID/status \
  -H "Authorization: Bearer $TOKEN_FRONTEND" -H "Content-Type: application/json" \
  -d '{"status":"RESOLVED","resolution":"ANSWERED"}')
check "author fast-closes their QUESTION (ANSWERED)" 200 "$CODE"

# Create a PROBLEM as FRONTEND, try to resolve it as the author → should fail (only owner)
POST_ID2=$(create_post "$TOKEN_FRONTEND" "PROBLEM" "GENERAL" "P by frontend")
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH $API/posts/$POST_ID2/status \
  -H "Authorization: Bearer $TOKEN_FRONTEND" -H "Content-Type: application/json" \
  -d '{"status":"RESOLVED","resolution":"FIXED","buildIssueUrl":"https://github.com/x/y/issues/1"}')
check "author cannot resolve their own PROBLEM (owner-only)" 403 "$CODE"

# Owner (FOUNDER, via fallback) resolves it → should succeed
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH $API/posts/$POST_ID2/status \
  -H "Authorization: Bearer $TOKEN_FOUNDER" -H "Content-Type: application/json" \
  -d '{"status":"RESOLVED","resolution":"FIXED","buildIssueUrl":"https://github.com/x/y/issues/1"}')
check "owner resolves PROBLEM with buildIssueUrl (FIXED)" 200 "$CODE"

echo
echo "-- 2.3 Resolution payload validation --"
POST_ID3=$(create_post "$TOKEN_FRONTEND" "PROBLEM" "GENERAL" "P for parked test")
# PARKED without reason → 400
BODY=$(curl -s -X PATCH $API/posts/$POST_ID3/status \
  -H "Authorization: Bearer $TOKEN_FOUNDER" -H "Content-Type: application/json" \
  -d '{"status":"RESOLVED","resolution":"PARKED"}')
CODE_KEY=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('code','?'))")
check "PARKED without resolutionReason returns REASON_REQUIRED" REASON_REQUIRED "$CODE_KEY"

POST_ID4=$(create_post "$TOKEN_FRONTEND" "PROBLEM" "GENERAL" "P for build url test")
# FIXED without buildIssueUrl → 400
BODY=$(curl -s -X PATCH $API/posts/$POST_ID4/status \
  -H "Authorization: Bearer $TOKEN_FOUNDER" -H "Content-Type: application/json" \
  -d '{"status":"RESOLVED","resolution":"FIXED"}')
CODE_KEY=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('code','?'))")
check "FIXED Problem without buildIssueUrl returns BUILD_URL_REQUIRED" BUILD_URL_REQUIRED "$CODE_KEY"

echo
echo "-- 2.4 Use Case must resolve as RULE_DECIDED --"
UC_ID=$(curl -s -X POST $API/posts -H "Authorization: Bearer $TOKEN_FRONTEND" -H "Content-Type: application/json" \
  -d '{"title":"UC test","description":"desc","type":"QUESTION","section":"GENERAL","isUseCase":true}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['data']['id'])")
BODY=$(curl -s -X PATCH $API/posts/$UC_ID/status \
  -H "Authorization: Bearer $TOKEN_FOUNDER" -H "Content-Type: application/json" \
  -d '{"status":"RESOLVED","resolution":"ANSWERED"}')
CODE_KEY=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('code','?'))")
check "Use Case with non-RULE_DECIDED resolution rejected" RULE_DECIDED_REQUIRED "$CODE_KEY"

BODY=$(curl -s -X PATCH $API/posts/$UC_ID/status \
  -H "Authorization: Bearer $TOKEN_FOUNDER" -H "Content-Type: application/json" \
  -d '{"status":"RESOLVED","resolution":"RULE_DECIDED"}')
STATUS=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('status','?'))")
check "Use Case resolves with RULE_DECIDED" RESOLVED "$STATUS"

echo
echo "-- 2.5 Reopen: only author/owner --"
# Reopen POST_ID (a QUESTION resolved above by author) as BACKEND (neither) → 403
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH $API/posts/$POST_ID/status \
  -H "Authorization: Bearer $TOKEN_BACKEND" -H "Content-Type: application/json" \
  -d '{"status":"OPEN"}')
check "third-party cannot reopen resolved post" 403 "$CODE"
# Reopen by author → 200 and resolution cleared
BODY=$(curl -s -X PATCH $API/posts/$POST_ID/status \
  -H "Authorization: Bearer $TOKEN_FRONTEND" -H "Content-Type: application/json" \
  -d '{"status":"OPEN"}')
RES=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['data'].get('resolution','none'))")
check "reopen by author clears resolution" None "$RES"

echo
echo "-- 2.6 Post-number sequential & atomic across parallel creates --"
# Fire 5 concurrent creates and confirm all got distinct LOOP-YYYY-NNNN numbers
tmp=$(mktemp)
for i in 1 2 3 4 5; do
  (curl -s -X POST $API/posts -H "Authorization: Bearer $TOKEN_FRONTEND" -H "Content-Type: application/json" \
    -d "{\"title\":\"race $i\",\"description\":\"d\",\"type\":\"QUESTION\",\"section\":\"GENERAL\"}" \
    | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['data']['postNumber'])" >> $tmp) &
done
wait
UNIQ=$(sort $tmp | uniq | wc -l | tr -d ' ')
check "5 concurrent posts get 5 distinct postNumbers" 5 "$UNIQ"
rm $tmp

echo
echo "-- 2.7 Audit log rows written for state transitions --"
# Query DB directly
AUDIT_ACTIONS=$(docker exec backend-db-1 psql -U postgres -d athwart_loop -tA -c \
  "SELECT DISTINCT \"actionType\" FROM \"AuditLog\" WHERE \"postId\" = $POST_ID ORDER BY \"actionType\";" | tr '\n' ',' | sed 's/,$//')
echo "  audit actions for QUESTION post: $AUDIT_ACTIONS"
# Expect POST_ACKNOWLEDGED,POST_CREATED,POST_REOPENED,POST_RESOLVED (order alphabetical)
if [[ "$AUDIT_ACTIONS" == *"POST_CREATED"* && "$AUDIT_ACTIONS" == *"POST_RESOLVED"* && "$AUDIT_ACTIONS" == *"POST_REOPENED"* ]]; then
  PASS=$((PASS+1)); echo "  PASS  audit trail contains CREATED/RESOLVED/REOPENED"
else
  FAIL=$((FAIL+1)); echo "  FAIL  audit trail missing entries"
  FAILS+=("audit trail")
fi

echo
echo "-- 2.8 Duplicate email registration rejected --"
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST $API/auth/register -H "Content-Type: application/json" \
  -d '{"email":"audit-frontend@test.local","password":"password12","name":"Dup Attempt"}')
check "duplicate email registration returns 409" 409 "$CODE"

echo
echo "-- 2.9 Login error generic (no user-existence leak) --"
BODY=$(curl -s -X POST $API/auth/login -H "Content-Type: application/json" \
  -d '{"email":"nobody-nonexistent@example.com","password":"anything123"}')
CODE_KEY=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('code','?'))")
check "unknown-email login returns generic INVALID_CREDENTIALS" INVALID_CREDENTIALS "$CODE_KEY"
BODY=$(curl -s -X POST $API/auth/login -H "Content-Type: application/json" \
  -d '{"email":"audit-frontend@test.local","password":"WRONG_PW"}')
CODE_KEY=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('code','?'))")
check "wrong-password login returns generic INVALID_CREDENTIALS" INVALID_CREDENTIALS "$CODE_KEY"

echo
echo "==== SECTION 3 · DATA INTEGRITY ===="

echo
echo "-- 3.1 email @unique enforced at DB level --"
UNIQ=$(docker exec backend-db-1 psql -U postgres -d athwart_loop -tA -c \
  "SELECT 1 FROM pg_indexes WHERE tablename='User' AND indexdef LIKE '%email%' AND indexdef LIKE '%UNIQUE%';")
check "User.email has unique index" 1 "$UNIQ"

echo
echo "-- 3.2 Vote is composite PK (no double vote) --"
POST_V=$(create_post "$TOKEN_FRONTEND" "IDEA" "GENERAL" "vote test")
CODE1=$(curl -s -o /dev/null -w "%{http_code}" -X POST $API/posts/$POST_V/vote -H "Authorization: Bearer $TOKEN_BACKEND")
CODE2=$(curl -s -o /dev/null -w "%{http_code}" -X POST $API/posts/$POST_V/vote -H "Authorization: Bearer $TOKEN_BACKEND")
# 201 first (create), then toggle behavior → 200 (delete) means it's a toggle not a dup — that's the design
check "first vote creates (201)" 201 "$CODE1"
check "second vote toggles (200)" 200 "$CODE2"

echo
echo "==== SECTION 4 · FRONTEND (server-side pieces) ===="
# Full UI verification comes separately in the report.

echo
echo "==== SECTION 5 · CONFIG HYGIENE ===="

echo
echo "-- 5.1 .env is gitignored --"
grep -q "^\.env" ../.gitignore && echo "  PASS  .env in .gitignore" && PASS=$((PASS+1)) || { echo "  FAIL  .env not gitignored"; FAIL=$((FAIL+1)); FAILS+=(".env gitignore"); }

echo
echo "-- 5.2 .env.example present with placeholders (no real secrets) --"
if grep -q "super-secret-key\|change-me\|your-" .env.example; then
  echo "  PASS  .env.example uses placeholder"; PASS=$((PASS+1))
else
  echo "  FAIL  .env.example may contain a real secret"; FAIL=$((FAIL+1)); FAILS+=(".env.example placeholder")
fi

echo
echo "-- 5.3 No reference to Loop_from_scratch in this codebase --"
HITS=$(grep -rn "Loop_from_scratch" src/ ../frontend/src/ 2>/dev/null | wc -l | tr -d ' ')
check "no leftover Loop_from_scratch references" 0 "$HITS"

echo
echo "==== SECTION 6 · AUTH RATE LIMIT (must run LAST — exhausts IP quota) ===="
BLOCKED=0
for i in {1..12}; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST $API/auth/login \
    -H "Content-Type: application/json" -d '{"email":"audit-admin@test.local","password":"WRONGPASS"}')
  if [ "$CODE" = "429" ]; then BLOCKED=1; fi
done
check "auth rate limiter triggers within 12 wrong logins" 1 "$BLOCKED"

echo
echo "======================="
echo "  PASS: $PASS   FAIL: $FAIL"
if [ $FAIL -ne 0 ]; then
  echo "Failed items:"
  for f in "${FAILS[@]}"; do echo "  - $f"; done
fi
echo "======================="
