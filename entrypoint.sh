#!/bin/sh

yarn install
DATABASE_URL=$POSTGRES_URL yarn prisma migrate reset -f --skip-generate
yarn prisma generate --data-proxy
exec "$@"
