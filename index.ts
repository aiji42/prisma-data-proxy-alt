import express from 'express';
import { ApolloServer, gql } from 'apollo-server-express';
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

const typeDefs = gql`
  type User {
    id: Int
    name: String
    email: String
    teamId: String
    createdAt: String
    updatedAt: String
    Team(where: ANY): Team
  }
  type Team {
    id: ID
    name: String
    labels: [String]
    createdAt: String
    updatedAt: String
    users(where: ANY): [User]
  }
  scalar ANY

  type Query {
    findFirstUser(where: ANY): User
    findFirstTeam(where: ANY): Team
  }
`;

const resolvers = {
  User: {
    Team: async (_: unknown, args: any, context: { promise: any }) => {
      return context.promise = context.promise.Team(args)
    },
  },
  Team: {
    users: async (_: unknown, args: any, context: { promise: any }) => {
      return context.promise = context.promise.users(args)
    },
  },
  Query: {
    findFirstUser: async (_: unknown, args: any, context: { promise: any }) => {
      return context.promise = db.user.findFirst(args)
    },
    findFirstTeam: async (_: unknown, args: any, context: { promise: any }) => {
      return context.promise = db.team.findFirst(args)
    },
  },
};

const port = process.env.PORT || "3000";
const corsOrigin = process.env.CORS_ORIGIN;

(async () => {
  const app = express();
  const server = new ApolloServer({
    typeDefs,
    resolvers
  });
  await server.start();
  server.applyMiddleware({ app, path: '/*' });
  app.listen({ port }, () =>
    console.log(`🚀 Server ready at http://localhost:${port}${server.graphqlPath}`)
  );
})()