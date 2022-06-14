# Prisma Data Proxy Alternative

This is a library to alternate and self-host the [Prisma Data Proxy (cloud.prisma.io)](https://www.prisma.io/docs/concepts/data-platform/data-proxy).

In order to deploy your project to edge runtimes (such as Cloudflare Workers or Vercel Edge Functions) and use Prisma, you will need to use the Prisma Data Proxy.  
However, it is currently only available in a limited number of regions and the choice of data sources is limited. There is also the stress of latency caused by cold standby.

Therefore, I have created a server library that replaces the Prisma Data Proxy. Using it, you are free from those stressful limitations.  
You can deploy it on any platform in any region you like and use any data source you like, such as Supabase.

No changes are required to your prisma client code, just set the `DATABASE_URL` to the URL you self-hosted with this library.

### Caution 

This library is unaffiliated with the Prisma development team and is unofficial.  

Future updates to @prisma/client may make this library unavailable.

Use at your own risk.

## Setup

### Setup proxy server

First, an Apollo server is built as a substitute for the data proxy.  
Use `express` as middleware.

```bash
yarn add prisma-data-proxy-alt express apollo-server-express
```

The server script is as follows.  
Note that requests can reach paths other than `/graphql`. It is recommended that all paths be made available to receive requests.

```ts
import { PrismaClient, Prisma } from "@prisma/client";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { authenticate, errorHandler, makeServerConfig } from "prisma-data-proxy-alt";

const db = new PrismaClient();

const port = process.env.PORT || "3000";
const authToken = process.env.DATA_PROXY_API_KEY || "foo";

(async () => {
  const app = express();
  const server = new ApolloServer(makeServerConfig(Prisma, db));

  await Promise.all([db.$connect(), server.start()]);
  app.use(errorHandler());
  app.use(authenticate(authToken));
  server.applyMiddleware({
    app,
    path: "/*",
  });
  app.listen({ port }, () =>
    console.log(
      `🚀 Server ready at http://localhost:${port}${server.graphqlPath}`
    )
  );
})();
```

### Setup Prisma

Include prisma schema in your project. **The same schema as the client must be made available for reference.**  

Install `prisma` (to generate) and `@prisma/client`.
```bash
yarn add -D prisma
yarn add @prisma/client
```


## Deploy 

### GCP Cloud Run

Create `dockerfile`

```dockerfile
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
```

Create `cloudbuild.yml`

```yml
steps:
  - name: 'gcr.io/kaniko-project/executor:latest'
    args:
      - --destination=gcr.io/$PROJECT_ID/prisma-data-proxy-alt:$SHORT_SHA
      - --destination=gcr.io/$PROJECT_ID/prisma-data-proxy-alt:latest
      - --cache=true
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - run
      - deploy
      - prisma-data-proxy-alt
      - --image
      - gcr.io/$PROJECT_ID/prisma-data-proxy-alt:latest
      - --region
      - $_REGION
      - --allow-unauthenticated
      - --set-env-vars
      - DATABASE_URL=$_DATABASE_URL
      - --set-env-vars
      - DATA_PROXY_API_KEY=$_DATA_PROXY_API_KEY
substitutions:
  _REGION: asia-northeast1
  _DATABASE_URL: your_database_url
  _DATA_PROXY_API_KEY: your_api_key
```

From the GCP web console, link cloudbuild to the repository.
Set `_REGION`, `_DATABASE_URL`, and `_DATA_PROXY_API_KEY` in the substitutions.

- `_REGION`: The region of cloud run deploy
- `_DATABASE_URL`: Connection URL to your data source (mysql, postgres, etc.)
- `_DATA_PROXY_API_KEY`: Arbitrary string to be used when connecting data proxy. This value is used as an authentication token for connections from the client.
  (do not divulge it to outside parties)

Note the URL of the cloud run after deployment is complete.

## For Client

On the client side, prisma client is generated in data proxy mode.
```bash
yarn prisma generate --data-proxy
```

Create a `DATABSE_URL` from the domain of the server you deployed and the api key (`DATA_PROXY_API_KEY`) you set for it.
```
DATABSE_URL=prisma://${YOUR_DEPLOYED_PROJECT_DOMAIN}?api_key=${DATA_PROXY_API_KEY}
```

## Contribution

## LICENCE