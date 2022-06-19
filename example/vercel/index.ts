import { PrismaClient, Prisma } from "@prisma/client";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import {
  beforeMiddleware,
  afterMiddleware,
  makeServerConfig,
} from "prisma-data-proxy-alt";

const db = new PrismaClient();
db.$connect();

const apiKey = process.env.DATA_PROXY_API_KEY || "foo";

const app = express();
app.use(beforeMiddleware({ apiKey }));
app.use(afterMiddleware());

const server = new ApolloServer(makeServerConfig(Prisma, db));

(async () => {
  await server.start();

  server.applyMiddleware({
    app,
    path: "/*",
  });
  if (process.env.PORT) {
    app.listen({ port: process.env.PORT });
  }
})();

export default app;
