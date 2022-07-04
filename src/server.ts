#! /usr/bin/env node
import { PrismaClient } from "@prisma/client";
import { getDMMF, getSchemaSync } from "@prisma/sdk";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { afterMiddleware, makeServerConfig, beforeMiddleware } from "./";
import { config } from "dotenv";
config();

const db = new PrismaClient(
  process.env.NODE_ENV === "production"
    ? undefined
    : { log: ["query", "info", "error", "warn"] }
);
db.$connect();

const apiKey = process.env.DATA_PROXY_API_KEY;
if (!apiKey) {
  throw Error("`DATA_PROXY_API_KEY` is not set.");
}

const app = express();
app.use(beforeMiddleware({ apiKey }));
app.use(afterMiddleware());

(async () => {
  const dmmf = await getDMMF({
    datamodel: getSchemaSync(),
  });
  const server = new ApolloServer({
    ...makeServerConfig(dmmf, db),
  });

  await server.start();

  server.applyMiddleware({
    app,
    path: "/*",
  });
  if (process.env.PORT) {
    const port = process.env.PORT;
    app.listen({ port }, () => {
      console.log(`🔮 Alternative Prisma Data Proxy listening on port ${port}`);
    });
  } else {
    console.info(
      `🔮 Alternative Prisma Data Proxy skipped listen because no PORT was specified.`
    );
  }
})();

export default app;
