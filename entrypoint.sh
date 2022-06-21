#!/bin/sh

yarn install
if [ -n "$MIGRATE" ]; then
  yarn prisma migrate reset -f
fi
exec "$@"
