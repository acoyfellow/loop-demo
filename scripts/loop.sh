#!/usr/bin/env bash
# loop-demo: failure until success
#
# The loop IS failure. Each iteration heals toward completion.
# Runs until all gates pass. PAUSED is your kill switch.
#
set -euo pipefail

# Agent config (override with env vars)
AGENT="${LOOP_AGENT:-opencode}"
MODEL="${LOOP_MODEL:-big-pickle}"
ENDPOINT="${LOOP_ENDPOINT:-https://opencode.ai/zen/v1}"
COOLDOWN="${LOOP_COOLDOWN:-5}"

# Resolve API key based on agent
case $AGENT in
  opencode) API_KEY="${OPENCODE_ZEN_API_KEY:-}" ;;
  claude)   API_KEY="${ANTHROPIC_API_KEY:-}"; MODEL="${LOOP_MODEL:-claude-sonnet-4-20250514}"; ENDPOINT="https://api.anthropic.com/v1" ;;
  openai)   API_KEY="${OPENAI_API_KEY:-}"; MODEL="${LOOP_MODEL:-gpt-4o}"; ENDPOINT="https://api.openai.com/v1" ;;
  *)        echo "Unknown agent: $AGENT"; exit 1 ;;
esac

mkdir -p .gateproof

# Check kill switch
if [[ -f .gateproof/PAUSED ]]; then
  echo "⏸️  PAUSED. Delete .gateproof/PAUSED to resume."
  exit 0
fi

# Inject deja memory
echo "Querying deja.coey.dev for memory..."
CONTEXT=$(head -30 prd.ts 2>/dev/null || echo "loop-demo")
DEJA=$(curl -s -X POST https://deja.coey.dev/inject \
  -H "Content-Type: application/json" \
  -d "{\"context\": \"$CONTEXT\", \"format\": \"prompt\", \"limit\": 3}" 2>/dev/null || echo '{}')
echo "$DEJA" | jq -r '.injection // "No memory"' > .gateproof/deja-context.md
echo "Memory loaded."

# State
ITERATION=0; [[ -f .gateproof/iteration ]] && ITERATION=$(cat .gateproof/iteration)
STUCK=0; [[ -f .gateproof/stuck ]] && STUCK=$(cat .gateproof/stuck)

echo ""
echo "=== loop-demo: failure until success ==="
echo "Agent: $AGENT ($MODEL)"
echo "Iteration: $ITERATION | Stuck: $STUCK"
echo "Kill switch: touch .gateproof/PAUSED"
echo "========================================"

# The loop
while true; do
  [[ -f .gateproof/PAUSED ]] && { echo "⏸️  PAUSED"; exit 0; }
  
  ITERATION=$((ITERATION + 1))
  echo "$ITERATION" > .gateproof/iteration
  echo ""
  echo "=== Iteration $ITERATION ==="
  
  # Run PRD
  set +e
  OUTPUT=$(bun run prd.ts --report .gateproof/prd-report.json 2>&1)
  STATUS=$?
  set -e
  
  if [[ $STATUS -eq 0 ]]; then
    echo "✅ All gates passed!"
    echo "0" > .gateproof/stuck
    exit 0
  fi
  
  echo "$OUTPUT" | tail -20
  
  # Need API key to heal
  if [[ -z "$API_KEY" ]]; then
    echo "⚠️  No API key for $AGENT - cannot auto-heal"
    echo "   Set ${AGENT^^}_API_KEY or OPENCODE_ZEN_API_KEY"
    exit 1
  fi
  
  # Run agent to heal
  echo "Healing with $AGENT..."
  
  # Build prompt with prd + failure + deja context
  DEJA_CONTEXT=$(cat .gateproof/deja-context.md 2>/dev/null || echo "")
  PROMPT="You are fixing a gateproof PRD failure.

PRD (prd.ts):
$(cat prd.ts)

Failure output:
$OUTPUT

Memory from previous work:
$DEJA_CONTEXT

Fix the issue. Make minimal changes."
  
  # Call agent (simplified - in real impl use prd-loop.ts)
  # For now just track that we tried
  echo "[Would call $AGENT here - implement agent integration]"
  
  # Check for changes
  if git diff --quiet 2>/dev/null; then
    STUCK=$((STUCK + 1))
    echo "$STUCK" > .gateproof/stuck
    echo "⚠️  No changes (stuck: $STUCK)"
    
    if [[ $STUCK -ge 10 ]]; then
      echo "🛑 Stuck 10x. Auto-pausing."
      touch .gateproof/PAUSED
      exit 1
    fi
  else
    echo "0" > .gateproof/stuck
    STUCK=0
  fi
  
  sleep "$COOLDOWN"
done
