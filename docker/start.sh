#!/bin/sh

# Prisma Version
yarn prisma version

# Build Prisma Client
yarn prisma generate --schema=${PRISMA_SCHEMA_PATH}

# Start the app
node /app/dist/server.js