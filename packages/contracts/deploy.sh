#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../../.env"

# Load env vars (strip inline comments)
if [ -f "$ENV_FILE" ]; then
  export DEPLOYER_PRIVATE_KEY=$(grep '^DEPLOYER_PRIVATE_KEY=' "$ENV_FILE" | cut -d= -f2 | awk '{print $1}')
  export ORCHESTRATOR_ADDRESS=$(grep '^ORCHESTRATOR_ADDRESS=' "$ENV_FILE" | cut -d= -f2 | awk '{print $1}')
fi

if [ -z "${DEPLOYER_PRIVATE_KEY:-}" ] || [ -z "${ORCHESTRATOR_ADDRESS:-}" ]; then
  echo "Error: DEPLOYER_PRIVATE_KEY and ORCHESTRATOR_ADDRESS must be set in .env"
  exit 1
fi

echo "Deploying contracts to 0G Galileo Testnet..."

cd "$SCRIPT_DIR"
forge script script/Deploy.s.sol \
  --rpc-url https://evmrpc-testnet.0g.ai \
  --broadcast \
  --legacy \
  --gas-price 4000000000

echo ""
echo "Done. Update packages/frontend/src/lib/contracts.ts with the new addresses above."
