#!/usr/bin/bash

exit_status=0

function run_command {
  local command="$1"
  local tmp_output
  tmp_output=$(mktemp)

  echo "Running: $command"
  if ! eval "$command" >"$tmp_output" 2>&1; then
    echo "Command failed: $command" >&2
    cat "$tmp_output" >&2
    exit_status=1
  fi

  rm -f "$tmp_output"
}

[ ! -d node_modules ] && run_command "npm install --prefer-offline --no-audit"

run_command "npm run build"

exit $exit_status
