# Fastify

[Fastify](https://fastify.dev/) is a high-performance Node.js web framework. This guide shows how to generate an OpenAPI spec with `to-openapi` and serve it as a Fastify plugin.

## Basic Setup

Generate your spec and register a route that serves it.

```ts
import Fastify from "fastify";
import { openapi } from "to-openapi";
import { z } from "zod";

const spec = openapi({
  info: {
    title: "Fastify API",
    version: "1.0.0",
  },
  servers: [{ url: "http://localhost:3000" }],
  paths: {
    "GET /articles": {
      summary: "List articles",
      tags: ["Articles"],
      query: z.object({
        page: z.number().optional(),
        limit: z.number().optional(),
      }),
      200: z.array(
        z.object({
          id: z.string(),
          title: z.string(),
          content: z.string(),
          published: z.boolean(),
        })
      ),
    },
    "POST /articles": {
      summary: "Create an article",
      tags: ["Articles"],
      body: z.object({
        title: z.string(),
        content: z.string(),
      }),
      201: z.object({
        id: z.string(),
        title: z.string(),
        content: z.string(),
        published: z.boolean(),
      }),
      400: { description: "Validation error" },
    },
    "GET /articles/{id}": {
      summary: "Get an article by ID",
      tags: ["Articles"],
      params: z.object({
        id: z.string(),
      }),
      200: z.object({
        id: z.string(),
        title: z.string(),
        content: z.string(),
        published: z.boolean(),
      }),
      404: { description: "Article not found" },
    },
    "PATCH /articles/{id}": {
      summary: "Update an article",
      tags: ["Articles"],
      params: z.object({
        id: z.string(),
      }),
      body: z.object({
        title: z.string().optional(),
        content: z.string().optional(),
        published: z.boolean().optional(),
      }),
      200: z.object({
        id: z.string(),
        title: z.string(),
        content: z.string(),
        published: z.boolean(),
      }),
      404: { description: "Article not found" },
    },
    "DELETE /articles/{id}": {
      summary: "Delete an article",
      tags: ["Articles"],
      params: z.object({
        id: z.string(),
      }),
      204: { description: "Article deleted" },
      404: { description: "Article not found" },
    },
  },
});

const app = Fastify({ logger: true });

// Serve the OpenAPI spec
app.get("/openapi.json", async () => {
  return spec;
});

// Implement your routes
app.get("/articles", async () => {
  return [];
});

app.post("/articles", async (request, reply) => {
  const body = request.body as { title: string; content: string };
  reply.status(201);
  return { id: "1", ...body, published: false };
});

app.get("/articles/:id", async (request) => {
  const { id } = request.params as { id: string };
  return { id, title: "Hello World", content: "...", published: true };
});

app.patch("/articles/:id", async (request) => {
  const { id } = request.params as { id: string };
  const body = request.body as Record<string, unknown>;
  return { id, title: "Hello World", content: "...", published: true, ...body };
});

app.delete("/articles/:id", async (_request, reply) => {
  reply.status(204);
});

app.listen({ port: 3000 });
```

## As a Fastify Plugin

Encapsulate the OpenAPI spec serving logic as a reusable Fastify plugin.

```ts
import Fastify, { type FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { openapi, type ToOpenapiDefinition } from "to-openapi";

// Plugin that generates and serves the OpenAPI spec
function openapiPlugin(
  fastify: FastifyInstance,
  opts: { definition: ToOpenapiDefinition; path?: string },
  done: () => void,
) {
  const spec = openapi(opts.definition);
  const servePath = opts.path ?? "/openapi.json";

  fastify.get(servePath, async () => {
    return spec;
  });

  done();
}

export const openapiSpec = fp(openapiPlugin);
```

Then use it in your application:

```ts
import Fastify from "fastify";
import { z } from "zod";
import { openapiSpec } from "./openapi-plugin.js";

const app = Fastify({ logger: true });

app.register(openapiSpec, {
  definition: {
    info: {
      title: "Fastify API",
      version: "1.0.0",
    },
    paths: {
      "GET /items": {
        summary: "List items",
        200: z.array(z.object({ id: z.string(), name: z.string() })),
      },
      "POST /items": {
        summary: "Create an item",
        body: z.object({ name: z.string() }),
        201: z.object({ id: z.string(), name: z.string() }),
      },
    },
  },
  path: "/openapi.json",
});

app.get("/items", async () => {
  return [];
});

app.post("/items", async (request, reply) => {
  const body = request.body as { name: string };
  reply.status(201);
  return { id: "1", ...body };
});

app.listen({ port: 3000 });
```

## Using the Class-Based API

The `OpenAPI` class builder is useful when routes are registered dynamically or across multiple plugin files.

```ts
import Fastify from "fastify";
import { OpenAPI } from "to-openapi";
import { z } from "zod";

const api = new OpenAPI({
  info: {
    title: "Fastify API",
    version: "1.0.0",
  },
  servers: [{ url: "http://localhost:3000" }],
});

const app = Fastify({ logger: true });

// Register routes with both Fastify and the OpenAPI builder
api.route("get", "/comments", {
  summary: "List comments",
  tags: ["Comments"],
  query: z.object({
    articleId: z.string().optional(),
  }),
  200: z.array(
    z.object({
      id: z.string(),
      articleId: z.string(),
      text: z.string(),
    })
  ),
});

app.get("/comments", async () => {
  return [];
});

api.route("post", "/comments", {
  summary: "Add a comment",
  tags: ["Comments"],
  body: z.object({
    articleId: z.string(),
    text: z.string(),
  }),
  201: z.object({
    id: z.string(),
    articleId: z.string(),
    text: z.string(),
  }),
});

app.post("/comments", async (request, reply) => {
  const body = request.body as { articleId: string; text: string };
  reply.status(201);
  return { id: "1", ...body };
});

// Serve the spec (call .document() to generate)
app.get("/openapi.json", async () => {
  return api.document();
});

app.listen({ port: 3000 });
```

## Fastify's Built-in OpenAPI Support

Fastify has its own OpenAPI integration through [`@fastify/swagger`](https://github.com/fastify/fastify-swagger), which generates specs from Fastify's JSON Schema route definitions.

**Use `@fastify/swagger` when:**

- You already use Fastify's built-in JSON Schema validation.
- You want spec generation tightly coupled with Fastify's route lifecycle.

**Use `to-openapi` when:**

- You use schema libraries like Zod, ArkType, or Valibot via Standard Schema instead of raw JSON Schema.
- You need the plugin system for cross-cutting concerns (bearer auth, auto tags, error responses).
- You want to merge specs from multiple services using `merge()`.
- You share schema definitions across frameworks or services that are not all Fastify.
