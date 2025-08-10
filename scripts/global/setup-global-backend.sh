#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

printf "\n[Global Backend Setup] Initializing reusable toolkit under %s\n" "$ROOT_DIR"

# Create directories
mkdir -p "$ROOT_DIR/scripts/global" \
         "$ROOT_DIR/shared/global" \
         "$ROOT_DIR/templates/new-app"

# 1) Global environment export script
cat > "$ROOT_DIR/scripts/global/export-env.sh" <<'EOF'
#!/usr/bin/env bash
# Source this file in your shell or CI to export global backend env vars.
# Example: echo "source /absolute/path/to/scripts/global/export-env.sh" >> ~/.zshrc

export SUPABASE_URL="https://brroucjplqmngljroknr.supabase.co"
export SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJycm91Y2pwbHFtbmdsanJva25yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NTg4NDksImV4cCI6MjA3MDEzNDg0OX0.a9QHFs7JtfRM3y5pi82jqAFmrwDRuaPLwDUzeBlG7uE"
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJycm91Y2pwbHFtbmdsanJva25yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDU1ODg0OSwiZXhwIjoyMDcwMTM0ODQ5fQ.vMDzajYZQ8k-AqzTKdM0D5nCsj85XRI7YGObMzVQyOc"
export SUPABASE_FUNCTION_URL="https://brroucjplqmngljroknr.supabase.co/functions/v1/hyper-handler"

# Optional: set this if you want the edge function to run raw SQL fallback
# export SUPABASE_DB_URL="postgres://postgres:postgres@db.host:5432/postgres"

echo "[export-env] Exported SUPABASE_* and SUPABASE_FUNCTION_URL in current shell." >&2
EOF
chmod +x "$ROOT_DIR/scripts/global/export-env.sh"

# 2) Reusable TS helpers as a local module (can be imported or packed)
cat > "$ROOT_DIR/shared/global/package.json" <<'EOF'
{
  "name": "@webinarpilot/backend-core",
  "version": "1.0.0",
  "type": "module",
  "main": "index.ts",
  "private": true,
  "peerDependencies": {
    "@supabase/supabase-js": ">=2.0.0"
  }
}
EOF

cat > "$ROOT_DIR/shared/global/index.ts" <<'EOF'
export * from './supabase-client';
export * from './edge';
EOF

cat > "$ROOT_DIR/shared/global/supabase-client.ts" <<'EOF'
import { createClient, SupabaseClient } from '@supabase/supabase-js';

type EnvName = 'SUPABASE_URL' | 'SUPABASE_ANON_KEY' | 'SUPABASE_SERVICE_ROLE_KEY' | 'SUPABASE_FUNCTION_URL';

function requireEnv(name: EnvName): string {
  const v = process.env[name];
  if (!v) throw new Error(`[backend-core] Missing required env: ${name}`);
  return v;
}

export function createServiceClient(): SupabaseClient {
  return createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'));
}

export function createAnonClient(): SupabaseClient {
  return createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_ANON_KEY'));
}

export function getEdgeFunctionUrl(): string {
  return process.env.SUPABASE_FUNCTION_URL || `${requireEnv('SUPABASE_URL')}/functions/v1/hyper-handler`;
}
EOF

cat > "$ROOT_DIR/shared/global/edge.ts" <<'EOF'
import type { RequestInit } from 'node-fetch';
import { getEdgeFunctionUrl } from './supabase-client';

function requireEnv(name: 'SUPABASE_SERVICE_ROLE_KEY' | 'SUPABASE_ANON_KEY'): string {
  const v = process.env[name];
  if (!v) throw new Error(`[backend-core] Missing required env: ${name}`);
  return v;
}

export async function callEdgeFunction(payload: any, init?: RequestInit): Promise<any> {
  const url = getEdgeFunctionUrl();
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${requireEnv('SUPABASE_SERVICE_ROLE_KEY')}`,
      'Content-Type': 'application/json',
      apikey: process.env.SUPABASE_ANON_KEY || ''
    },
    body: JSON.stringify(payload),
    ...(init || {})
  });

  const text = await res.text();
  try {
    const json = text ? JSON.parse(text) : {};
    if (!res.ok) throw new Error(`[edge] ${res.status}: ${JSON.stringify(json)}`);
    return json;
  } catch (e) {
    if (!res.ok) throw new Error(`[edge] ${res.status}: ${text}`);
    return text;
  }
}
EOF

# 3) Template for new apps using this global backend
cat > "$ROOT_DIR/templates/new-app/.env.example" <<'EOF'
# Copy to .env and load in your runtime
SUPABASE_URL=https://brroucjplqmngljroknr.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJycm91Y2pwbHFtbmdsanJva25yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NTg4NDksImV4cCI6MjA3MDEzNDg0OX0.a9QHFs7JtfRM3y5pi82jqAFmrwDRuaPLwDUzeBlG7uE
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJycm91Y2pwbHFtbmdsanJva25yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDU1ODg0OSwiZXhwIjoyMDcwMTM0ODQ5fQ.vMDzajYZQ8k-AqzTKdM0D5nCsj85XRI7YGObMzVQyOc
SUPABASE_FUNCTION_URL=https://brroucjplqmngljroknr.supabase.co/functions/v1/hyper-handler
EOF

cat > "$ROOT_DIR/templates/new-app/README-global-backend.md" <<'EOF'
Global Backend Usage (Supabase + Edge)

- Source global env in your shell or CI:
  source /absolute/path/to/scripts/global/export-env.sh

- Install peer dependency in your app:
  npm i @supabase/supabase-js

- Import reusable helpers from this repo (as a file path import or symlink):
  import { createServiceClient, createAnonClient, callEdgeFunction } from '<path-to-repo>/shared/global';

- Or pack/install as a local package:
  # From repo root
  (cd shared/global && npm pack)
  # In your app
  npm i <tarball-file>.tgz

Environment Variables
- SUPABASE_URL: https://brroucjplqmngljroknr.supabase.co
- SUPABASE_ANON_KEY: exact anon key
- SUPABASE_SERVICE_ROLE_KEY: exact service role key
- SUPABASE_FUNCTION_URL: https://brroucjplqmngljroknr.supabase.co/functions/v1/hyper-handler

Security
- Do not expose the service role key in frontend code. Use server-side only.

EOF

# 4) Helper script to print current env quickly
cat > "$ROOT_DIR/scripts/global/print-env.sh" <<'EOF'
#!/usr/bin/env bash
set -e
cat <<EOT
SUPABASE_URL=${SUPABASE_URL:-}
SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY:-}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY:-}
SUPABASE_FUNCTION_URL=${SUPABASE_FUNCTION_URL:-}
EOT
EOF
chmod +x "$ROOT_DIR/scripts/global/print-env.sh"

printf "[Global Backend Setup] Complete.\n"
printf "- Global env script: %s\n" "$ROOT_DIR/scripts/global/export-env.sh"
printf "- Reusable module:   %s\n" "$ROOT_DIR/shared/global"
printf "- New app template:  %s\n" "$ROOT_DIR/templates/new-app"
