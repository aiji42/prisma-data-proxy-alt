FROM node:16.15-bullseye-slim as base

RUN apt-get update && apt-get install -y tini \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

FROM base as builder

COPY expamle/gcp/tsconfig.json .
COPY expamle/gcp/package.json .
COPY expamle/gcp/yarn.lock .
COPY expamle/gcp/prisma/schema.prisma ./prisma/schema.prisma
COPY expamle/gcp/index.ts .

RUN yarn install

RUN yarn prisma generate
RUN yarn build

FROM base

ENV PORT=8080

COPY --from=builder /app/package.json .
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

USER node

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "dist/index.js"]