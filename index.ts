import "reflect-metadata";
import express from "express";
import { ApolloServer, gql } from "apollo-server-express";
import { PrismaClient, Prisma } from "@prisma/client";

const TypeDefinitions = Prisma.dmmf.schema.outputObjectTypes.model.map((m) => {
  return `
      type ${m.name} {
        ${m.fields
          .map((f) => {
            return `${f.name}${
              f.args.length > 0
                ? `(${f.args.map(({ name }) => `${name}: Any`).join(" ")})`
                : ""
            }: ${
              f.outputType.isList
                ? `[${f.outputType.type}]`
                : `${f.outputType.type}`
            }${f.isNullable ? "!" : ""}`;
          })
          .join(" ")}
      }
      `;
});

const Definitions = Prisma.dmmf.schema.outputObjectTypes.prisma.map((m) => {
  return `
      type ${m.name} {
        ${m.fields
          .map((f) => {
            return `${f.name}${
              f.args.length > 0
                ? `(${f.args.map(({ name }) => `${name}: Any`).join(" ")})`
                : ""
            }: ${
              f.outputType.isList
                ? `[${f.outputType.type}]`
                : `${f.outputType.type}`
            }${f.isNullable ? "!" : ""}`;
          })
          .join(" ")}
      }
      `;
});

const db = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

const typeDefs = gql`
  scalar Any
  scalar DateTime
  scalar Json

  ${TypeDefinitions}

  ${Definitions}
`;

const toLowerFirstLetter = (str: string) => {
  return str.charAt(0).toLowerCase() + str.substring(1);
};

const relatedRecordProxy = (model: string) => {
  return new Proxy(
    {},
    {
      get: (_, method) => {
        const { fields } =
          Prisma.dmmf.datamodel.models.find(({ name }) => name === model) ?? {};
        if (!fields) return undefined;
        const idFieldName = fields.find(({ isId }) => isId)?.name;
        const field = fields.find(({ name }) => name === method.toString());
        if (!field?.relationName) return undefined;

        return async (
          parent: unknown,
          args: any,
          context: { promise: any }
        ) => {
          try {
            // @ts-ignore
            return await db[toLowerFirstLetter(model)]
              // @ts-ignore
              .findUnique({ where: { [idFieldName]: parent[idFieldName] } })
              [method](args);
          } catch (e) {
            console.log(e);
          }
        };
      },
    }
  );
};

const mapping: Record<string, { operation: string; model: string }> =
  Object.fromEntries(
    Prisma.dmmf.mappings.modelOperations.flatMap(
      ({ model, plural, ...operations }) => {
        return Object.entries(operations).map(([k, v]) => [
          v,
          { operation: k, model },
        ]);
      }
    )
  );

const resolvers = {
  User: relatedRecordProxy("User"),
  Team: relatedRecordProxy("Team"),
  Query: new Proxy(
    {},
    {
      get: (_, method) => {
        return async (_: unknown, args: any, context: { promise: any }) => {
          const { operation, model } = mapping[method.toString()];
          console.log(args, operation);

          return (context.promise =
            // @ts-ignore
            db[toLowerFirstLetter(model)][operation](args));
        };
      },
    }
  ),
  Mutation: new Proxy(
    {},
    {
      get: (_, method) => {
        return async (_: unknown, args: any, context: { promise: any }) => {
          const { operation, model } = mapping[method.toString()];
          return (context.promise =
            // @ts-ignore
            db[toLowerFirstLetter(model)][operation](args));
        };
      },
    }
  ),
};

const port = process.env.PORT || "3000";
const corsOrigin = process.env.CORS_ORIGIN;

(async () => {
  db.$connect();
  const app = express();
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });
  await server.start();
  server.applyMiddleware({ app, path: "/*" });
  app.listen({ port }, () =>
    console.log(
      `🚀 Server ready at http://localhost:${port}${server.graphqlPath}`
    )
  );
})();
