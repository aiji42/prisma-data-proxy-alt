import { ApolloServer, gql } from 'apollo-server-fastify';
import fastify from 'fastify';

const typeDefs = gql`
  type Book {
    title: String
    author: String
  }

  type Query {
    books: [Book]
  }
`;

const books = [
  {
    title: 'The Awakening',
    author: 'Kate Chopin',
  },
  {
    title: 'City of Glass',
    author: 'Paul Auster',
  },
];

const resolvers = {
  Query: {
    books: () => books,
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers
});

const app = fastify({
  logger: true,
  trustProxy: true,
});

const port = process.env.PORT || "3000";
const corsOrigin = process.env.CORS_ORIGIN;

(async function () {
  await server.start();
  app.register(
    server.createHandler({
      path: "/graphql",
      cors: corsOrigin ? { origin: corsOrigin.split(",") } : false,
    })
  );
  await app.listen(port, "0.0.0.0", (err, address) => {
    if (err) throw err;
    console.log(`🚀 Server ready at ${address}${server.graphqlPath}`);
  });
})();
