#!/bin/bash -xe

bundle exec rails db:create
bundle exec rails db:schema:load
bundle exec rspec
