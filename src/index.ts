import express from "express";
import { ApolloServer } from "apollo-server-express";
import { PrismaClient, Prisma } from "@prisma/client";
import { makeTypeDefs } from "./helpers/makeTypeDefs";
import { makeResolver } from "./helpers/makeResolver";
import { customError } from "./helpers/customError";

const db = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

const port = process.env.PORT || "3000";
const corsOrigin = process.env.CORS_ORIGIN;

(async () => {
  const app = express();
  const server = new ApolloServer({
    typeDefs: makeTypeDefs(Prisma),
    resolvers: makeResolver(db, Prisma),
  });

  await Promise.all([db.$connect(), server.start()]);
  app.use(customError);
  server.applyMiddleware({ app, path: "/*" });
  app.listen({ port }, () =>
    console.log(
      `🚀 Server ready at http://localhost:${port}${server.graphqlPath}`
    )
  );
})();
