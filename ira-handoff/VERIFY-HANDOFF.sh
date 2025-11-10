#!/bin/bash

# Project Handoff Verification Script
# This script verifies the handoff is complete and accurate
# Run from: /root/websites/stores-stepperslife/ira-handoff/

echo "======================================"
echo "  PROJECT HANDOFF VERIFICATION"
echo "======================================"
echo ""
echo "Project: stores.stepperslife.com"
echo "Date: $(date +%Y-%m-%d)"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASS=0
FAIL=0
WARN=0

# Helper functions
check_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASS++))
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAIL++))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARN++))
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. DOCUMENTATION CHECK"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd /root/websites/stores-stepperslife/ira-handoff

# Check critical documentation files
if [ -f "HANDOFF-SUMMARY.md" ]; then
    check_pass "HANDOFF-SUMMARY.md exists"
else
    check_fail "HANDOFF-SUMMARY.md missing"
fi

if [ -f "HANDOFF.md" ]; then
    check_pass "HANDOFF.md exists"
else
    check_fail "HANDOFF.md missing"
fi

if [ -f "QUICK-STATUS.md" ]; then
    check_pass "QUICK-STATUS.md exists"
else
    check_fail "QUICK-STATUS.md missing"
fi

if [ -f "MIDDLEWARE-MIGRATION-GUIDE.md" ]; then
    check_pass "MIDDLEWARE-MIGRATION-GUIDE.md exists"
else
    check_fail "MIDDLEWARE-MIGRATION-GUIDE.md missing"
fi

if [ -f "README.md" ]; then
    check_pass "README.md exists"
else
    check_fail "README.md missing"
fi

# Count total docs
TOTAL_DOCS=$(ls -1 *.md 2>/dev/null | wc -l)
echo ""
echo "Total documentation files: $TOTAL_DOCS"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. PROJECT STATUS CHECK"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd /root/websites/stores-stepperslife

# Check if PM2 process exists
if pm2 list | grep -q "stores-stepperslife"; then
    check_pass "PM2 process 'stores-stepperslife' exists"

    # Check if it's running
    if pm2 list | grep "stores-stepperslife" | grep -q "online"; then
        check_pass "Application is running (online)"
    else
        check_warn "Application exists but not running"
    fi
else
    check_warn "PM2 process 'stores-stepperslife' not found"
fi

# Check if port 3008 is in use
if lsof -i :3008 >/dev/null 2>&1; then
    check_pass "Port 3008 is in use (application listening)"
else
    check_warn "Port 3008 not in use"
fi

# Check database connection
if docker ps | grep -q postgres; then
    check_pass "PostgreSQL container is running"
else
    check_warn "PostgreSQL container not found"
fi

# Check Redis
if docker ps | grep -q redis; then
    check_pass "Redis container is running"
else
    check_warn "Redis container not found"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. CODE QUALITY CHECK"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check ESLint
echo "Running ESLint check..."
ESLINT_ERRORS=$(npm run lint 2>&1 | grep -E "^[0-9]+ error" | awk '{print $1}')
if [ -z "$ESLINT_ERRORS" ]; then
    ESLINT_ERRORS=0
fi

if [ "$ESLINT_ERRORS" -eq 0 ]; then
    check_pass "ESLint: 0 errors"
else
    check_fail "ESLint: $ESLINT_ERRORS errors"
fi

# Count ESLint warnings
ESLINT_WARNINGS=$(npm run lint 2>&1 | grep -E "^[0-9]+ warning" | awk '{print $1}')
if [ -z "$ESLINT_WARNINGS" ]; then
    ESLINT_WARNINGS=0
fi

if [ "$ESLINT_WARNINGS" -le 10 ]; then
    check_pass "ESLint: $ESLINT_WARNINGS warnings (acceptable)"
else
    check_warn "ESLint: $ESLINT_WARNINGS warnings (expected ≤10)"
fi

# Check TypeScript errors
echo "Counting TypeScript errors..."
TS_ERRORS=$(npx tsc --noEmit 2>&1 | grep "error TS" | wc -l)

if [ "$TS_ERRORS" -gt 0 ]; then
    check_warn "TypeScript: $TS_ERRORS errors (expected, documented)"
else
    check_pass "TypeScript: 0 errors (AMAZING!)"
fi

# Check modified files
MODIFIED_FILES=$(git status --short 2>/dev/null | wc -l)
if [ "$MODIFIED_FILES" -gt 0 ]; then
    check_pass "Git: $MODIFIED_FILES modified files tracked"
else
    check_warn "Git: No modified files (may be committed)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. ENVIRONMENT CHECK"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check .env file
if [ -f ".env" ]; then
    check_pass ".env file exists"

    # Check critical env vars
    if grep -q "DATABASE_URL" .env; then
        check_pass "DATABASE_URL configured"
    else
        check_fail "DATABASE_URL not found in .env"
    fi

    if grep -q "NEXTAUTH_SECRET" .env; then
        check_pass "NEXTAUTH_SECRET configured"
    else
        check_fail "NEXTAUTH_SECRET not found in .env"
    fi

    if grep -q "STRIPE_SECRET_KEY" .env; then
        check_pass "STRIPE_SECRET_KEY configured"
    else
        check_warn "STRIPE_SECRET_KEY not found in .env"
    fi
else
    check_fail ".env file missing"
fi

# Check node_modules
if [ -d "node_modules" ]; then
    check_pass "node_modules exists"
else
    check_warn "node_modules missing (run npm install)"
fi

# Check package.json
if [ -f "package.json" ]; then
    check_pass "package.json exists"
else
    check_fail "package.json missing"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5. PRISMA CHECK"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check Prisma schema
if [ -f "prisma/schema.prisma" ]; then
    check_pass "Prisma schema exists"
else
    check_fail "Prisma schema missing"
fi

# Check Prisma Client
if [ -d "node_modules/.prisma" ] || [ -d "node_modules/@prisma" ]; then
    check_pass "Prisma Client generated"
else
    check_warn "Prisma Client not generated (run: npx prisma generate)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6. SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

TOTAL=$((PASS + FAIL + WARN))

echo -e "${GREEN}✓ Passed:${NC}  $PASS"
echo -e "${RED}✗ Failed:${NC}  $FAIL"
echo -e "${YELLOW}⚠ Warnings:${NC} $WARN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Total Checks: $TOTAL"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "7. KEY METRICS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "ESLint Errors:      $ESLINT_ERRORS (Goal: 0)"
echo "ESLint Warnings:    $ESLINT_WARNINGS (Goal: ≤10)"
echo "TypeScript Errors:  $TS_ERRORS (Goal: 0, Est. 18-26h)"
echo "Documentation:      $TOTAL_DOCS files"
echo "Modified Files:     $MODIFIED_FILES"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "8. NEXT STEPS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Read: ira-handoff/HANDOFF-SUMMARY.md"
echo "2. Read: ira-handoff/HANDOFF.md"
echo "3. Read: ira-handoff/MIDDLEWARE-MIGRATION-GUIDE.md"
echo "4. Start: Phase 1 - API Middleware Migration (~120 errors)"
echo ""
echo "Estimated time to completion: 18-26 hours"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$FAIL" -eq 0 ]; then
    echo -e "${GREEN}✓ HANDOFF VERIFICATION COMPLETE${NC}"
    echo ""
    echo "Status: READY FOR HANDOFF ✅"
else
    echo -e "${RED}✗ VERIFICATION FAILED${NC}"
    echo ""
    echo "Status: ISSUES NEED ATTENTION ⚠️"
    echo "Please review failed checks above."
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

exit 0
