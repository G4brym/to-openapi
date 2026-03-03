# `OpenAPI` Class

The `OpenAPI` class provides an imperative, builder-style API for constructing OpenAPI documents. It supports method chaining and is well suited for scenarios where routes and schemas are registered incrementally -- for example, when routes are spread across multiple files or modules.

## Import

```ts
import { OpenAPI } from 'to-openapi'
```

## Constructor

```ts
new OpenAPI(options: OpenAPIOptions)
```

### `OpenAPIOptions`

```ts
interface OpenAPIOptions {
  info: InfoObject
  openapi?: "3.0.3" | "3.1.0"
  servers?: ServerObject[]
  security?: SecurityRequirementObject[]
  securitySchemes?: Record<string, SecuritySchemeObject>
  tags?: TagObject[]
  externalDocs?: ExternalDocsObject
  plugins?: ToOpenapiPlugin[]
}
```

This is the same set of fields as `ToOpenapiDefinition` but without `paths` and `schemas`, since those are registered separately through the `.route()` and `.schema()` methods.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `info` | `InfoObject` | (required) | API metadata: title, version, description, etc. |
| `openapi` | `"3.0.3" \| "3.1.0"` | `"3.1.0"` | Target OpenAPI specification version. |
| `servers` | `ServerObject[]` | `undefined` | Server definitions. |
| `security` | `SecurityRequirementObject[]` | `undefined` | Global security requirements. |
| `securitySchemes` | `Record<string, SecuritySchemeObject>` | `undefined` | Security scheme definitions for components. |
| `tags` | `TagObject[]` | `undefined` | Tag definitions for grouping operations. |
| `externalDocs` | `ExternalDocsObject` | `undefined` | Link to external documentation. |
| `plugins` | `ToOpenapiPlugin[]` | `undefined` | Plugins for transforming routes, schemas, and the document. |

## Methods

### `.schema(name, schema)`

```ts
schema(name: string, schema: StandardJSONSchemaV1): this
```

Registers a named schema that will appear in `components.schemas` in the output document. Returns `this` for chaining.

**Parameters:**

- `name` -- the component schema name (e.g. `"User"`, `"Error"`).
- `schema` -- a Standard JSON Schema V1 object (e.g. a Zod schema, Valibot schema, or any schema implementing the Standard Schema spec).

**Example:**

```ts
api.schema('User', z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
}))
```

### `.route(method, path, definition)`

```ts
route(method: HttpMethod, path: string, definition: RouteShorthand): this
```

Adds a route to the API. Returns `this` for chaining.

**Parameters:**

- `method` -- the HTTP method: `"get"`, `"post"`, `"put"`, `"patch"`, `"delete"`, `"head"`, `"options"`, or `"trace"`.
- `path` -- the URL path. Supports both OpenAPI-style `{param}` and Express-style `:param` syntax. Express-style parameters are automatically converted to OpenAPI format.
- `definition` -- a `RouteShorthand` object describing the operation. See the [Types reference](./types.md) for the full interface.

**Example:**

```ts
api.route('get', '/users/{id}', {
  summary: 'Get user by ID',
  tags: ['users'],
  params: z.object({ id: z.string().uuid() }),
  200: z.object({ id: z.string(), name: z.string() }),
  404: 'User not found',
})
```

### `.document()`

```ts
document(): OpenAPIDocument
```

Builds and returns the frozen `OpenAPIDocument`. This method processes all registered routes and schemas, runs plugin hooks, and assembles the final document.

The returned document is deeply frozen and immutable. Calling `.document()` multiple times will rebuild the document each time.

**Example:**

```ts
const doc = api.document()
console.log(JSON.stringify(doc, null, 2))
```

## Chaining Pattern

All configuration methods return `this`, enabling fluent method chaining:

```ts
import { OpenAPI } from 'to-openapi'
import { z } from 'zod'

const doc = new OpenAPI({
  info: { title: 'Task API', version: '1.0.0' },
  servers: [{ url: 'https://api.example.com' }],
  securitySchemes: {
    bearer: { type: 'http', scheme: 'bearer' },
  },
  security: [{ bearer: [] }],
  tags: [{ name: 'tasks', description: 'Task management' }],
})
  .schema('Task', z.object({
    id: z.string().uuid(),
    title: z.string(),
    completed: z.boolean(),
  }))
  .schema('Error', z.object({
    message: z.string(),
  }))
  .route('get', '/tasks', {
    summary: 'List tasks',
    tags: ['tasks'],
    query: z.object({
      completed: z.boolean().optional(),
    }),
    200: z.array(z.object({
      id: z.string(),
      title: z.string(),
      completed: z.boolean(),
    })),
  })
  .route('post', '/tasks', {
    summary: 'Create a task',
    tags: ['tasks'],
    body: z.object({
      title: z.string(),
      completed: z.boolean().optional(),
    }),
    201: z.object({
      id: z.string(),
      title: z.string(),
      completed: z.boolean(),
    }),
    400: 'Validation error',
  })
  .route('get', '/tasks/:id', {
    summary: 'Get a task',
    tags: ['tasks'],
    params: z.object({ id: z.string().uuid() }),
    200: z.object({
      id: z.string(),
      title: z.string(),
      completed: z.boolean(),
    }),
    404: 'Task not found',
  })
  .route('delete', '/tasks/:id', {
    summary: 'Delete a task',
    tags: ['tasks'],
    params: z.object({ id: z.string().uuid() }),
    204: null,
    404: 'Task not found',
  })
  .document()
```

## When to Use Class vs Function

| Scenario | Recommended API |
|----------|----------------|
| All routes defined in one place | `openapi()` function |
| Routes spread across multiple files/modules | `OpenAPI` class |
| Dynamic route registration (e.g. from a framework) | `OpenAPI` class |
| Simple, declarative configuration | `openapi()` function |
| Need to share the builder instance across modules | `OpenAPI` class |

The **`openapi()` function** is best when you have a complete, static definition of your API in a single object. It is concise and declarative.

The **`OpenAPI` class** is best when you need to build the document incrementally. For example, you might create the instance in a central module and then call `.route()` from individual route files:

```ts
// api.ts
import { OpenAPI } from 'to-openapi'

export const api = new OpenAPI({
  info: { title: 'My API', version: '1.0.0' },
})

// routes/users.ts
import { api } from '../api'
import { z } from 'zod'

api.route('get', '/users', {
  summary: 'List users',
  200: z.array(z.object({ id: z.string(), name: z.string() })),
})

// main.ts
import { api } from './api'
import './routes/users'

const doc = api.document()
```

Both APIs produce identical output and support the same features, including plugins, security schemes, and named schemas.
