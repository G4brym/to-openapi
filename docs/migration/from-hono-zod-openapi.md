# Migrating from @hono/zod-openapi

This guide walks you through migrating from `@hono/zod-openapi` to `to-openapi`. The key insight is that to-openapi **separates spec generation from routing**, so you keep your existing Hono routes and generate the OpenAPI document independently.

## Why migrate?

- **Schema flexibility**: `@hono/zod-openapi` locks you into Zod. `to-openapi` works with any [Standard Schema](https://github.com/standard-schema/standard-schema)-compatible library (Zod, Valibot, ArkType, and others).
- **Separation of concerns**: `@hono/zod-openapi` tightly couples your route definitions to spec generation, requiring you to use `createRoute()` and a special `OpenAPIHono` class. With to-openapi, your routes are plain Hono routes and the spec is defined separately.
- **Simpler routing code**: Your Hono handlers become cleaner because they do not carry OpenAPI metadata inline. The spec definition lives in its own module.
- **Plugin system**: Extend spec generation with composable plugins without modifying route handlers.

## Key differences

| Concept | @hono/zod-openapi | to-openapi |
|---|---|---|
| Router class | `OpenAPIHono` | Standard `Hono` |
| Route definition | `createRoute({ ... })` | Plain `app.get()` / `app.post()` etc. |
| Spec generation | Coupled to routing via `app.openapi()` | Separate `openapi()` call or `OpenAPI` class |
| Schema annotations | `.openapi()` on Zod schemas | `extend()` for metadata, or plain schemas |
| Serving the spec | `app.doc('/doc', { ... })` | Serve from a regular Hono route |

## Step-by-step migration

### 1. Update dependencies

```bash
npm uninstall @hono/zod-openapi
npm install to-openapi
# Keep hono -- it stays as your router
```

### 2. Replace `OpenAPIHono` with standard `Hono`

```ts
// Before
import { OpenAPIHono } from '@hono/zod-openapi';
const app = new OpenAPIHono();

// After
import { Hono } from 'hono';
const app = new Hono();
```

### 3. Replace `createRoute()` and `app.openapi()` with plain Hono routes

In `@hono/zod-openapi`, you define routes using `createRoute()` and register them with `app.openapi()`:

```ts
// Before: @hono/zod-openapi
import { createRoute, z } from '@hono/zod-openapi';

const getUserRoute = createRoute({
  method: 'get',
  path: '/users/{id}',
  request: {
    params: z.object({
      id: z.string().openapi({ example: 'abc-123' }),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: UserSchema,
        },
      },
      description: 'Returns the user',
    },
  },
});

app.openapi(getUserRoute, (c) => {
  const { id } = c.req.valid('param');
  // ...handler logic
  return c.json(user, 200);
});
```

With to-openapi, your route is a standard Hono route:

```ts
// After: plain Hono
app.get('/users/:id', async (c) => {
  const id = c.req.param('id');
  // ...handler logic
  return c.json(user, 200);
});
```

### 4. Create a separate spec definition

Define your OpenAPI spec in its own module using the `openapi()` function:

```ts
// spec.ts
import { z } from 'zod';
import { openapi } from 'to-openapi';

const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
});

export const spec = openapi({
  info: { title: 'My API', version: '1.0.0' },
  servers: [{ url: 'https://api.example.com' }],
  schemas: {
    User: UserSchema,
  },
  paths: {
    "GET /users/{id}": {
      summary: "Get user by ID",
      200: UserSchema,
      404: null,
    },
    "POST /users": {
      summary: "Create a user",
      body: z.object({
        name: z.string(),
        email: z.string().email(),
      }),
      201: UserSchema,
    },
  },
});
```

### 5. Serve the spec from a route

Replace `app.doc()` with a regular Hono route that returns the generated document:

```ts
// Before: @hono/zod-openapi
app.doc('/doc', {
  openapi: '3.1.0',
  info: { title: 'My API', version: '1.0.0' },
});

// After: to-openapi
import { spec } from './spec';

app.get('/doc', (c) => c.json(spec));
```

## Full before/after example

### Before: @hono/zod-openapi

```ts
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';

const app = new OpenAPIHono();

// Schema with OpenAPI metadata baked in
const UserSchema = z.object({
  id: z.string().openapi({ example: 'abc-123' }),
  name: z.string(),
  email: z.string().email(),
}).openapi('User');

const CreateUserSchema = z.object({
  name: z.string().openapi({ example: 'Alice' }),
  email: z.string().email(),
}).openapi('CreateUser');

// Route definitions
const listUsersRoute = createRoute({
  method: 'get',
  path: '/users',
  summary: 'List all users',
  request: {
    query: z.object({
      limit: z.string().optional().openapi({ example: '10' }),
    }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: z.array(UserSchema) } },
      description: 'List of users',
    },
  },
});

const createUserRoute = createRoute({
  method: 'post',
  path: '/users',
  summary: 'Create a user',
  request: {
    body: {
      content: { 'application/json': { schema: CreateUserSchema } },
    },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: UserSchema } },
      description: 'User created',
    },
  },
});

const getUserRoute = createRoute({
  method: 'get',
  path: '/users/{id}',
  summary: 'Get a user by ID',
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: UserSchema } },
      description: 'The user',
    },
    404: {
      description: 'Not found',
    },
  },
});

// Handlers coupled to route definitions
app.openapi(listUsersRoute, async (c) => {
  const { limit } = c.req.valid('query');
  const users = await db.listUsers(Number(limit) || 20);
  return c.json(users, 200);
});

app.openapi(createUserRoute, async (c) => {
  const body = c.req.valid('json');
  const user = await db.createUser(body);
  return c.json(user, 201);
});

app.openapi(getUserRoute, async (c) => {
  const { id } = c.req.valid('param');
  const user = await db.getUser(id);
  if (!user) return c.json({ message: 'Not found' }, 404);
  return c.json(user, 200);
});

// Serve the spec
app.doc('/doc', {
  openapi: '3.1.0',
  info: { title: 'User API', version: '1.0.0' },
});

export default app;
```

### After: to-openapi + Hono

**`spec.ts`** -- Spec definition (separate from routing):

```ts
import { z } from 'zod';
import { openapi } from 'to-openapi';

const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
});

const CreateUserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
});

export const spec = openapi({
  info: { title: 'User API', version: '1.0.0' },
  servers: [{ url: 'https://api.example.com' }],
  schemas: {
    User: UserSchema,
    CreateUser: CreateUserSchema,
  },
  paths: {
    "GET /users": {
      summary: "List all users",
      query: z.object({
        limit: z.string().optional(),
      }),
      200: z.array(UserSchema),
    },
    "POST /users": {
      summary: "Create a user",
      body: CreateUserSchema,
      201: UserSchema,
    },
    "GET /users/{id}": {
      summary: "Get a user by ID",
      200: UserSchema,
      404: null,
    },
  },
});
```

**`app.ts`** -- Clean Hono routes:

```ts
import { Hono } from 'hono';
import { spec } from './spec';

const app = new Hono();

app.get('/users', async (c) => {
  const limit = Number(c.req.query('limit')) || 20;
  const users = await db.listUsers(limit);
  return c.json(users, 200);
});

app.post('/users', async (c) => {
  const body = await c.req.json();
  const user = await db.createUser(body);
  return c.json(user, 201);
});

app.get('/users/:id', async (c) => {
  const id = c.req.param('id');
  const user = await db.getUser(id);
  if (!user) return c.json({ message: 'Not found' }, 404);
  return c.json(user, 200);
});

// Serve the OpenAPI spec
app.get('/doc', (c) => c.json(spec));

export default app;
```

Notice that the route handlers are now plain Hono code with no OpenAPI coupling. Validation can still be handled by Hono middleware (like `@hono/zod-validator`) if desired -- it is simply no longer tied to spec generation.

## Tips for a smooth migration

- **You can migrate incrementally.** Start by creating the spec file alongside your existing `@hono/zod-openapi` setup, then move routes to plain Hono one at a time.
- **Validation is separate from spec generation.** If you relied on `@hono/zod-openapi` for request validation, add `@hono/zod-validator` or another validation middleware to your plain Hono routes.
- **Path parameter syntax.** Both `:id` and `{id}` styles are supported in to-openapi path keys. Use whichever you prefer.

## Next steps

- Read the [Getting Started guide](/guide/getting-started) for a full introduction to to-openapi.
- Explore the plugin system for bearer auth, error responses, and auto-tagging.
