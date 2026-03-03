# Migrating from zod-to-openapi

This guide walks you through migrating from `@asteasolutions/zod-to-openapi` to `to-openapi`. The migration is straightforward and results in a simpler, schema-agnostic setup.

## Why migrate?

- **Schema-agnostic**: `to-openapi` works with any schema library that implements [Standard Schema](https://github.com/standard-schema/standard-schema) (Zod, Valibot, ArkType, and more). You are not locked into Zod.
- **Simpler API**: No registry classes, no generator instances. A single `openapi()` function call produces your full OpenAPI document.
- **Plugin system**: Extend spec generation with composable plugins for auth, error responses, auto-tagging, and more.
- **Smaller surface area**: Fewer concepts to learn. Routes are defined with a concise shorthand syntax.

## Key differences

| Concept | zod-to-openapi | to-openapi |
|---|---|---|
| Annotating schemas | `.openapi('Name', { ... })` on Zod schemas | `extend(schema, { ... })` + register in `schemas` |
| Schema registry | `OpenAPIRegistry` class | `schemas` object in definition, or `OpenAPI.schema()` |
| Registering routes | `registry.registerPath({ ... })` | Route shorthand keys in `paths` (`"GET /users"`) |
| Generating the document | `new OpenAPIGenerator(registry, '3.1.0').generateDocument(...)` | `openapi(definition)` or `new OpenAPI(options).document()` |
| Path parameters | Defined inside `registerPath` request params | Auto-detected from path, or supply `params` schema |

## Step-by-step migration

### 1. Replace the package

```bash
npm uninstall @asteasolutions/zod-to-openapi
npm install to-openapi
```

### 2. Replace `.openapi()` annotations with `extend()` and `schemas`

In zod-to-openapi, you annotate schemas by calling `.openapi()` directly on a Zod schema:

```ts
// Before: zod-to-openapi
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

const UserSchema = z.object({
  id: z.string().openapi({ example: 'abc-123' }),
  name: z.string(),
  email: z.string().email(),
}).openapi('User');
```

In to-openapi, schemas stay as plain Zod schemas. Use `extend()` if you need to add OpenAPI-specific metadata, and register named schemas in the `schemas` object:

```ts
// After: to-openapi
import { z } from 'zod';
import { extend } from 'to-openapi';

const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
});

// Only needed if you want to add extra OpenAPI metadata
const UserSchemaWithExample = extend(UserSchema, {
  properties: { id: { example: 'abc-123' } },
});
```

### 3. Replace `registry.registerPath()` with route shorthand entries

In zod-to-openapi, you register each route with `registry.registerPath()`:

```ts
// Before: zod-to-openapi
registry.registerPath({
  method: 'get',
  path: '/users/{id}',
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      description: 'Successful response',
      content: {
        'application/json': {
          schema: UserSchema,
        },
      },
    },
  },
});
```

In to-openapi, routes are defined as keys in the `paths` object using `"METHOD /path"` format:

```ts
// After: to-openapi
// Routes are defined inline (see full example below)
paths: {
  "GET /users/{id}": {
    summary: "Get a user by ID",
    200: UserSchema,
  },
}
```

### 4. Replace `OpenAPIGenerator` with the `openapi()` function

In zod-to-openapi, you create a generator and call `generateDocument()`:

```ts
// Before: zod-to-openapi
import { OpenAPIGenerator } from '@asteasolutions/zod-to-openapi';

const generator = new OpenAPIGenerator(registry.definitions, '3.1.0');

const doc = generator.generateDocument({
  info: {
    title: 'My API',
    version: '1.0.0',
  },
  servers: [{ url: 'https://api.example.com' }],
});
```

In to-openapi, call `openapi()` with a single definition object:

```ts
// After: to-openapi
import { openapi } from 'to-openapi';

const doc = openapi({
  info: {
    title: 'My API',
    version: '1.0.0',
  },
  servers: [{ url: 'https://api.example.com' }],
  schemas: {
    User: UserSchema,
  },
  paths: {
    "GET /users/{id}": {
      summary: "Get a user by ID",
      200: UserSchema,
    },
  },
});
```

## Full before/after example

### Before: zod-to-openapi

```ts
import { extendZodWithOpenApi, OpenAPIRegistry, OpenAPIGenerator } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();

// Define schemas
const UserSchema = z.object({
  id: z.string().openapi({ example: 'abc-123' }),
  name: z.string(),
  email: z.string().email(),
}).openapi('User');

const CreateUserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
}).openapi('CreateUser');

const ErrorSchema = z.object({
  code: z.number(),
  message: z.string(),
}).openapi('Error');

// Register routes
registry.registerPath({
  method: 'get',
  path: '/users',
  summary: 'List all users',
  request: {
    query: z.object({
      limit: z.number().optional(),
      offset: z.number().optional(),
    }),
  },
  responses: {
    200: {
      description: 'List of users',
      content: {
        'application/json': {
          schema: z.array(UserSchema),
        },
      },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/users',
  summary: 'Create a user',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateUserSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'User created',
      content: {
        'application/json': {
          schema: UserSchema,
        },
      },
    },
    400: {
      description: 'Bad request',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/users/{id}',
  summary: 'Get user by ID',
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      description: 'Successful response',
      content: {
        'application/json': {
          schema: UserSchema,
        },
      },
    },
    404: {
      description: 'Not found',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
});

// Generate document
const generator = new OpenAPIGenerator(registry.definitions, '3.1.0');
const doc = generator.generateDocument({
  info: { title: 'User API', version: '1.0.0' },
  servers: [{ url: 'https://api.example.com' }],
});
```

### After: to-openapi

```ts
import { z } from 'zod';
import { openapi } from 'to-openapi';

// Define schemas (plain Zod -- no .openapi() calls needed)
const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
});

const CreateUserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
});

const ErrorSchema = z.object({
  code: z.number(),
  message: z.string(),
});

// Generate the full document in one call
const doc = openapi({
  info: { title: 'User API', version: '1.0.0' },
  servers: [{ url: 'https://api.example.com' }],
  schemas: {
    User: UserSchema,
    CreateUser: CreateUserSchema,
    Error: ErrorSchema,
  },
  paths: {
    "GET /users": {
      summary: "List all users",
      query: z.object({
        limit: z.number().optional(),
        offset: z.number().optional(),
      }),
      200: z.array(UserSchema),
    },
    "POST /users": {
      summary: "Create a user",
      body: CreateUserSchema,
      201: UserSchema,
      400: ErrorSchema,
    },
    "GET /users/{id}": {
      summary: "Get user by ID",
      200: UserSchema,
      404: ErrorSchema,
    },
  },
});
```

Notice how much less boilerplate is required. Path parameters like `{id}` are automatically detected. Response schemas are assigned directly to status code keys. Request bodies default to `application/json`.

## Using the class-based API

If you prefer an imperative, builder-style API similar to the registry pattern, to-openapi also provides the `OpenAPI` class:

```ts
import { z } from 'zod';
import { OpenAPI } from 'to-openapi';

const spec = new OpenAPI({
  info: { title: 'User API', version: '1.0.0' },
  servers: [{ url: 'https://api.example.com' }],
});

spec.schema('User', UserSchema);
spec.schema('CreateUser', CreateUserSchema);

spec.route('get', '/users', {
  summary: 'List all users',
  200: z.array(UserSchema),
});

spec.route('post', '/users', {
  summary: 'Create a user',
  body: CreateUserSchema,
  201: UserSchema,
});

const doc = spec.document();
```

## Next steps

- Read the [Getting Started guide](/guide/getting-started) for a full introduction to to-openapi.
- Explore the plugin system for bearer auth, error responses, and auto-tagging.
