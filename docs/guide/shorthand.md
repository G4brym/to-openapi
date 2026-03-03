# Route Shorthand

Routes in to-openapi are defined using a concise shorthand format. This page covers every field available in a route definition.

## Route Key Format

In the declarative `openapi()` API, routes are defined as keys in the `paths` object using the format `"METHOD /path"`:

```ts
openapi({
  info: { title: 'API', version: '1.0.0' },
  paths: {
    'GET /users': { /* ... */ },
    'POST /users': { /* ... */ },
    'DELETE /users/:id': { /* ... */ },
  },
})
```

In the `OpenAPI` class, the method and path are separate arguments to `.route()`:

```ts
api.route('get', '/users', { /* ... */ })
api.route('post', '/users', { /* ... */ })
api.route('delete', '/users/:id', { /* ... */ })
```

## Path Parameter Styles

Two styles are supported for path parameters. Both produce the same OpenAPI output with `{param}` syntax.

```ts
// Colon style -- auto-converted to {param}
'GET /users/:id'

// Brace style -- used as-is
'GET /users/{id}'
```

When using the `OpenAPI` class, the same conversion applies:

```ts
api.route('get', '/users/:id', { /* ... */ })
// Produces path: /users/{id}
```

Path parameters are automatically detected from the path and included as `required: true` parameters with `type: "string"` schema. Provide a `params` schema to customize their types. See [Request Parameters](/guide/request-params) for details.

## All Shorthand Fields

The `RouteShorthand` interface accepts the following fields:

| Field | Type | Description |
|---|---|---|
| `query` | Standard Schema | Object schema; each property becomes a query parameter |
| `params` | Standard Schema | Object schema; each property becomes a path parameter |
| `headers` | Standard Schema | Object schema; each property becomes a header parameter |
| `cookies` | Standard Schema | Object schema; each property becomes a cookie parameter |
| `body` | Standard Schema, `RequestBodyObject`, or `BodyShorthandObject` | Request body schema (wrapped in `application/json`), full OpenAPI RequestBodyObject, or shorthand with `contentType`/`example`/`examples` |
| `summary` | `string` | Short summary of the operation |
| `description` | `string` | Detailed description of the operation |
| `operationId` | `string` | Unique identifier for the operation (auto-generated if omitted) |
| `tags` | `string[]` | Tags for grouping operations |
| `deprecated` | `boolean` | Marks the operation as deprecated |
| `security` | `SecurityRequirementObject[]` | Security requirements for this operation |
| `[statusCode]` | Schema, `string`, `null`, `ResponseObject`, or `ResponseShorthandObject` | Response for a given HTTP status code (e.g., `200`, `201`, `404`) |
| `x-*` | `unknown` | Any `x-` prefixed key passes through as a vendor extension on the operation |

## Full Example

```ts
import { openapi } from 'to-openapi'
import { z } from 'zod'

const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
})

const ErrorSchema = z.object({
  message: z.string(),
  code: z.number(),
})

const doc = openapi({
  info: { title: 'User API', version: '2.0.0' },
  schemas: { User: UserSchema, Error: ErrorSchema },
  paths: {
    'PUT /users/:id': {
      summary: 'Update a user',
      description: 'Replaces all fields of an existing user.',
      operationId: 'updateUser',
      tags: ['users'],
      deprecated: false,
      security: [{ bearerAuth: [] }],
      query: z.object({
        notify: z.boolean().optional(),
      }),
      params: z.object({
        id: z.string().uuid(),
      }),
      headers: z.object({
        'x-request-id': z.string().optional(),
      }),
      body: UserSchema,
      200: UserSchema,
      400: ErrorSchema,
      404: null,
    },
  },
})
```

This produces an operation with:

- Path parameter `id` (from `:id` in the path, typed as UUID from `params`)
- Query parameter `notify` (optional boolean)
- Header parameter `x-request-id` (optional string)
- JSON request body using the User schema
- Three responses: 200 with User body, 400 with Error body, 404 with no body

## Auto-generated Operation IDs

When `operationId` is not provided, one is generated from the method and path:

| Route | Generated `operationId` |
|---|---|
| `GET /pets` | `get_pets` |
| `POST /users/:id` | `post_users_id` |
| `DELETE /orders/{orderId}/items` | `delete_orders_orderId_items` |

## Webhooks

Webhooks use the same `RouteShorthand` format as routes, with keys in `"METHOD eventName"` format. Webhooks are only supported in OpenAPI 3.1.0.

### Functional API

```ts
const doc = openapi({
  info: { title: 'API', version: '1.0.0' },
  paths: {
    'GET /tasks': { 200: TaskListSchema },
  },
  webhooks: {
    'POST taskCreated': {
      body: TaskSchema,
      200: null,
    },
    'POST taskDeleted': {
      body: z.object({ taskId: z.string() }),
      200: null,
    },
  },
})
```

### Class API

```ts
const doc = new OpenAPI({ info: { title: 'API', version: '1.0.0' } })
  .route('get', '/tasks', { 200: TaskListSchema })
  .webhook('post', 'taskCreated', { body: TaskSchema, 200: null })
  .webhook('post', 'taskDeleted', { body: z.object({ taskId: z.string() }), 200: null })
  .document()
```

Webhook definitions support the same fields as route definitions — schemas, responses, body, headers, examples, and vendor extensions all work the same way. Plugins also apply to webhooks (e.g., `bearerAuth` will add security to webhook operations).

## Related

- [Request Parameters](/guide/request-params) -- details on query, path, header, and cookie parameters
- [Responses](/guide/responses) -- all response definition styles
- [Schemas & $ref](/guide/schemas) -- how schemas are resolved
