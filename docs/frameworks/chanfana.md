# Chanfana

[Chanfana](https://chanfana.pages.dev/) is an OpenAPI framework for Cloudflare Workers that uses Standard Schema for request and response validation. It has built-in OpenAPI spec generation, so `to-openapi` is not required for basic usage. However, `to-openapi` can be useful alongside Chanfana when you need additional spec customization, want to merge specs from multiple services, or want to use its plugin system.

## When to Use to-openapi with Chanfana

- **Merging specs**: Combine Chanfana's generated spec with specs from other services using `merge()`.
- **Plugin system**: Apply cross-cutting transforms (bearer auth, auto tags, error responses) via `to-openapi` plugins.
- **Custom spec generation**: Build a separate spec from shared schemas that are also used in your Chanfana endpoints.

## Merging a Chanfana Spec with Another Service

Chanfana generates its own OpenAPI document. You can use `to-openapi`'s `merge()` to combine it with specs from other sources.

```ts
import { merge, openapi } from "to-openapi";
import { z } from "zod";

// Suppose this comes from Chanfana's built-in spec generation
const chanfanaSpec = {
  openapi: "3.1.0",
  info: { title: "Worker API", version: "1.0.0" },
  paths: {
    "/tasks": {
      get: {
        summary: "List tasks",
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: { type: "array", items: { type: "object" } },
              },
            },
          },
        },
      },
    },
  },
};

// Generate an additional spec with to-openapi
const internalSpec = openapi({
  info: { title: "Internal API", version: "1.0.0" },
  paths: {
    "GET /internal/health": {
      summary: "Internal health check",
      200: z.object({ status: z.literal("ok") }),
    },
  },
});

// Merge them together (chanfanaSpec is the base, so its info/servers are kept)
const combined = merge(chanfanaSpec, internalSpec);

// Serve the combined spec from your worker
export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/openapi.json") {
      return new Response(JSON.stringify(combined, null, 2), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("Not Found", { status: 404 });
  },
};
```

## Building a Standalone Spec for Cloudflare Workers

If you are writing a Cloudflare Worker without Chanfana and want an OpenAPI spec, `to-openapi` works directly.

```ts
import { openapi } from "to-openapi";
import { z } from "zod";

const spec = openapi({
  info: {
    title: "Worker API",
    version: "1.0.0",
  },
  servers: [{ url: "https://api.example.com" }],
  paths: {
    "GET /tasks": {
      summary: "List tasks",
      tags: ["Tasks"],
      200: z.array(
        z.object({
          id: z.string(),
          title: z.string(),
          completed: z.boolean(),
        })
      ),
    },
    "POST /tasks": {
      summary: "Create a task",
      tags: ["Tasks"],
      body: z.object({
        title: z.string(),
        completed: z.boolean().optional(),
      }),
      201: z.object({
        id: z.string(),
        title: z.string(),
        completed: z.boolean(),
      }),
    },
  },
});

const specJson = JSON.stringify(spec, null, 2);

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/openapi.json") {
      return new Response(specJson, {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle your actual API routes here...
    return new Response("Not Found", { status: 404 });
  },
};
```

::: tip
If you are starting a new Cloudflare Workers project and want full OpenAPI integration with validation, routing, and automatic spec generation, consider using Chanfana directly. Use `to-openapi` when you need its specific features like spec merging, the plugin system, or multi-schema-library support.
:::
