import { DMMF } from "@prisma/client/runtime";
import { PrismaClient } from "@prisma/client/scripts/default-index";
import { ApolloServerExpressConfig } from "apollo-server-express";
import { makeTypeDefs } from "./makeTypeDefs";
import { makeResolver } from "./makeResolver";

export const makeServerConfig = (
  dmmf: DMMF.Document,
  db: PrismaClient
): ApolloServerExpressConfig => {
  return {
    typeDefs: makeTypeDefs(dmmf),
    resolvers: makeResolver(dmmf, db),
  };
};
