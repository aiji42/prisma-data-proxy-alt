FROM node:16.15-bullseye-slim as base

RUN apt-get update && apt-get install -y tini \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

FROM base as builder

COPY tsconfig.json .
COPY package.json .
COPY yarn.lock .
COPY prisma/schema.prisma ./prisma/schema.prisma
COPY index.ts .

RUN yarn install

RUN yarn prisma generate
RUN yarn build

FROM base

ENV PORT=8080

COPY package.json .
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

USER node

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "dist/index.js"]