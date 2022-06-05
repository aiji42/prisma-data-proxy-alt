#!/bin/sh

yarn install
yarn prisma migrate reset -f
exec "$@"
