import { db } from "ponder:api";
import schema from "ponder:schema";
import { Hono } from "hono";
import { graphql, client } from "ponder";

const app = new Hono();

// Enable GraphQL API
// Access at: http://localhost:42069/graphql
// GraphiQL interface available at GET /graphql
app.use("/graphql", graphql({ db, schema }));

// Enable SQL over HTTP API
// Access at: http://localhost:42069/sql
// Use with @ponder/client and @ponder/react packages
app.use("/sql/*", client({ db, schema }));

export default app;
