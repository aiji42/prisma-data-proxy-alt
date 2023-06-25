#! /usr/bin/env node
import { PrismaClient } from "@prisma/client";
import { getDMMF, getSchema } from "@prisma/internals";
import express, { Response } from "express";
import { Express } from "express/node_modules/@types/express-serve-static-core";
import { ApolloServer } from "apollo-server-express";
import { afterMiddleware, makeServerConfig, beforeMiddleware } from "./";
import BigNumber from "bignumber.js";
import { config } from "dotenv";
config();

// @ts-ignore
BigInt.prototype.toJSON = function () {
  return BigNumber(this as any).toFixed();
};

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

if (process.env.ENABLE_PROMETHEUS_METRICS) {
  try {
    const metricsApp: Express = express();
    metricsApp.get("/metrics", async (_req, res: Response) => {
      let metrics = await db.$metrics.prometheus();
      res.end(metrics);
    });
    const port = process.env.PROMETHEUS_METRICS_PORT || 9090;
    metricsApp.listen({ port }, () => {
      console.log(
        `🔮 Alternative Prisma Data Proxy Prometheus metrics on port ${port} and path /metrics, http://instanceIP:${port}/metrics`
      );
    });
  } catch (e) {
    console.error(e);
    console.error('Must be enable previewFeatures = ["metrics"] in the schema');
  }
}

const app: Express = express();
app.use(beforeMiddleware({ apiKey }));
app.use(afterMiddleware());

(async () => {
  const dmmf = await getDMMF({
    datamodel: await getSchema(process.env.PRISMA_SCHEMA_PATH),
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
