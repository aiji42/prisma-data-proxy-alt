FROM node:18.3.0-bullseye-slim as base

RUN apt-get update && apt-get install -y tini ca-certificates curl \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

FROM base as builder

COPY . .

RUN yarn install

RUN yarn build

RUN yarn prisma version | tee /app/prisma_version.txt


FROM base

COPY --from=builder /app/prisma_version.txt ./prisma_version.txt
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/dist ./dist
COPY docker/start.sh /app/start.sh

RUN chmod a+x /app/start.sh

ENV PRISMA_SCHEMA_PATH=/app/node_modules/.prisma/client/schema.prisma

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["/app/start.sh"]