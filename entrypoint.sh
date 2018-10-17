#!/usr/bin/env bash
set -Eeo pipefail

env | grep -v '^_=' | >/tmp/environ
bundle exec rails db:migrate

exec $@
