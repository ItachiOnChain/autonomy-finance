#!/bin/bash

# Default to port 8545
PORT=${PORT:-8545}

echo "🚀 Starting Anvil on port $PORT..."
anvil --port $PORT --host 0.0.0.0 --chain-id 31337
