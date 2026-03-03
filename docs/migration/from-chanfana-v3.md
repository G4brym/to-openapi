# Migrating from Chanfana v3

This guide covers migrating from Chanfana v3 to v4 and explains how `to-openapi` can complement or replace Chanfana's built-in spec generation for greater flexibility.

## Context

Chanfana is a framework for building OpenAPI-documented APIs on Cloudflare Workers. Chanfana v3 used Zod directly for schema definitions. Chanfana v4 introduced support for the [Standard Schema](https://github.com/standard-schema/standard-schema) interface, making it schema-library-agnostic.

`to-openapi` fits into this picture as a standalone, schema-agnostic OpenAPI spec generator. You can use it:

1. **Alongside Chanfana v4** -- for additional spec customization that Chanfana does not expose natively.
2. **As a full replacement** -- to generate the spec entirely outside of Chanfana, giving you complete control.

## What changed from Chanfana v3 to v4

| Area | Chanfana v3 | Chanfana v4 |
|---|---|---|
| Schema library | Zod only | Any Standard Schema library |
| Schema definitions | `z.object(...)` passed directly | Standard Schema interface (`~standard` protocol) |
| OpenAPI generation | Built-in, limited customization | Built-in, but to-openapi can supplement or replace it |

## Migration steps

### 1. Update Chanfana to v4

```bash
npm install chanfana@latest
```

### 2. Update schema definitions to Standard Schema

In Chanfana v3, schemas were Zod-specific:

```ts
// Before: Chanfana v3 with Zod
import { z } from 'zod';
import { OpenAPIRoute } from 'chanfana';

class GetUser extends OpenAPIRoute {
  schema = {
    request: {
      params: z.object({
        id: z.string(),
      }),
    },
    responses: {
      '200': {
        description: 'User found',
        content: {
          'application/json': {
            schema: z.object({
              id: z.string(),
              name: z.string(),
              email: z.string(),
            }),
          },
        },
      },
    },
  };

  async handle(c) {
    const { id } = c.req.param();
    const user = await getUser(id);
    return c.json(user);
  }
}
```

In Chanfana v4, you can keep using Zod (it implements Standard Schema as of Zod 3.24+) or switch to another library like Valibot:

```ts
// After: Chanfana v4 with Valibot
import * as v from 'valibot';
import { OpenAPIRoute } from 'chanfana';

class GetUser extends OpenAPIRoute {
  schema = {
    request: {
      params: v.object({
        id: v.string(),
      }),
    },
    responses: {
      '200': {
        description: 'User found',
        content: {
          'application/json': {
            schema: v.object({
              id: v.string(),
              name: v.string(),
              email: v.pipe(v.string(), v.email()),
            }),
          },
        },
      },
    },
  };

  async handle(c) {
    const { id } = c.req.param();
    const user = await getUser(id);
    return c.json(user);
  }
}
```

### 3. Use to-openapi for additional spec customization

Chanfana generates a spec from your route classes, but you may want more control over the output -- adding security schemes, plugins, custom tags, or restructuring the document. Use `to-openapi` alongside Chanfana by generating your own spec and merging it with or replacing Chanfana's output.

```ts
import { openapi, merge } from 'to-openapi';
import * as v from 'valibot';

// Define shared schemas
const UserSchema = v.object({
  id: v.string(),
  name: v.string(),
  email: v.pipe(v.string(), v.email()),
});

const ErrorSchema = v.object({
  code: v.number(),
  message: v.string(),
});

// Generate additional spec sections with to-openapi
const additionalSpec = openapi({
  info: { title: 'My Worker API', version: '2.0.0' },
  securitySchemes: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    },
  },
  security: [{ bearerAuth: [] }],
  tags: [
    { name: 'Users', description: 'User management endpoints' },
    { name: 'Admin', description: 'Administrative endpoints' },
  ],
  schemas: {
    User: UserSchema,
    Error: ErrorSchema,
  },
  paths: {
    "GET /admin/stats": {
      summary: "Get system statistics",
      tags: ["Admin"],
      200: v.object({
        totalUsers: v.number(),
        activeUsers: v.number(),
      }),
    },
  },
});
```

You can then use the `merge()` function to combine Chanfana's generated spec with your additional definitions:

```ts
import { merge } from 'to-openapi';

// chanfanaSpec comes from Chanfana's built-in generation
// additionalSpec comes from to-openapi
const finalSpec = merge(chanfanaSpec, additionalSpec);
```

### 4. Full replacement: generate the spec entirely with to-openapi

If you want complete control over your OpenAPI document, you can bypass Chanfana's spec generation and use to-openapi exclusively. This is useful if you are moving away from Chanfana's class-based route pattern or want a single source of truth for your API spec.

```ts
import * as v from 'valibot';
import { openapi } from 'to-openapi';

const UserSchema = v.object({
  id: v.string(),
  name: v.string(),
  email: v.pipe(v.string(), v.email()),
});

const CreateUserSchema = v.object({
  name: v.string(),
  email: v.pipe(v.string(), v.email()),
});

const ErrorSchema = v.object({
  code: v.number(),
  message: v.string(),
});

const spec = openapi({
  info: {
    title: 'My Worker API',
    version: '2.0.0',
    description: 'A Cloudflare Worker API',
  },
  servers: [
    { url: 'https://api.example.workers.dev' },
  ],
  securitySchemes: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    },
  },
  security: [{ bearerAuth: [] }],
  tags: [
    { name: 'Users', description: 'User management' },
  ],
  schemas: {
    User: UserSchema,
    CreateUser: CreateUserSchema,
    Error: ErrorSchema,
  },
  paths: {
    "GET /users": {
      summary: "List users",
      tags: ["Users"],
      query: v.object({
        limit: v.optional(v.pipe(v.string(), v.transform(Number))),
        cursor: v.optional(v.string()),
      }),
      200: v.array(UserSchema),
    },
    "POST /users": {
      summary: "Create a user",
      tags: ["Users"],
      body: CreateUserSchema,
      201: UserSchema,
      400: ErrorSchema,
    },
    "GET /users/{id}": {
      summary: "Get user by ID",
      tags: ["Users"],
      200: UserSchema,
      404: ErrorSchema,
    },
    "DELETE /users/{id}": {
      summary: "Delete a user",
      tags: ["Users"],
      204: null,
      404: ErrorSchema,
    },
  },
});
```

## Example: Cloudflare Worker with to-openapi

Here is a complete example of a Cloudflare Worker that uses to-openapi for spec generation alongside plain Hono routing:

```ts
// worker.ts
import { Hono } from 'hono';
import { spec } from './spec'; // the to-openapi definition from above

const app = new Hono();

// Serve the OpenAPI spec
app.get('/openapi.json', (c) => c.json(spec));

// Application routes
app.get('/users', async (c) => {
  const limit = Number(c.req.query('limit')) || 20;
  const cursor = c.req.query('cursor');
  const users = await listUsers({ limit, cursor });
  return c.json(users);
});

app.post('/users', async (c) => {
  const body = await c.req.json();
  const user = await createUser(body);
  return c.json(user, 201);
});

app.get('/users/:id', async (c) => {
  const id = c.req.param('id');
  const user = await getUser(id);
  if (!user) return c.json({ code: 404, message: 'Not found' }, 404);
  return c.json(user);
});

app.delete('/users/:id', async (c) => {
  const id = c.req.param('id');
  await deleteUser(id);
  return c.body(null, 204);
});

export default app;
```

## Tips

- **Chanfana v4 + to-openapi work well together.** Use Chanfana for routing and validation, and to-openapi when you need finer control over the generated OpenAPI document.
- **to-openapi is framework-agnostic.** Whether you use Chanfana, Hono, or itty-router on Cloudflare Workers, the spec generation stays the same.
- **Plugins simplify common patterns.** to-openapi's plugin system can automatically add bearer auth headers, error response schemas, or tags based on path prefixes -- patterns that previously required manual configuration in Chanfana.

## Next steps

- Read the [Getting Started guide](/guide/getting-started) for a full introduction to to-openapi.
- Explore the plugin system for bearer auth, error responses, and auto-tagging.
