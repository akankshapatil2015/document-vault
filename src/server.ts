import "dotenv/config";
import { createSchema, createYoga } from "graphql-yoga";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { resolvers } from "./graphql/resolvers";

const typeDefs = readFileSync(
    new URL("./graphql/schema.graphql", import.meta.url),
    "utf8",
);

const yoga = createYoga({
    schema: createSchema({
        typeDefs,
        resolvers,
    }),
});

const server = createServer(yoga);

const port = Number(process.env.PORT ?? 4000);

server.listen(port, () => {
    console.log(`GraphQL server running at http://localhost:${port}/graphql`);
});