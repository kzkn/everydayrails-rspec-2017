#!/usr/bin/env bash

while read line; do
  export $line
done </tmp/environ
