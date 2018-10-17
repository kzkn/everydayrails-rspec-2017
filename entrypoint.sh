#!/usr/bin/env bash
set -Eeo pipefail

env | grep -v '^_=' | sed 's/^/export /' >/tmp/environ
bundle exec rails db:migrate

exec $@
