# `merge()` Function

The `merge()` function combines multiple OpenAPI documents into a single unified document. This is useful for composing microservice APIs, merging separately generated specs, or combining modular API definitions into a single output.

## Import

```ts
import { merge } from 'to-openapi'
```

## Signature

```ts
function merge(base: OpenAPIDocument, ...sources: OpenAPIDocument[]): OpenAPIDocument
```

## Parameters

- `base` -- the base OpenAPI document. Its `info`, `openapi` version, `servers`, `security`, and `externalDocs` take priority in the merged result.
- `...sources` -- one or more additional OpenAPI documents to merge into the base.

## Return Value

Returns a new `OpenAPIDocument` containing the merged content from all input documents.

## Merge Behavior

### Paths

Paths are merged by path key (e.g. `/users`), then by HTTP method within each path. If two documents define the same method on the same path, a `ToOpenapiError` with code `DUPLICATE_PATH` is thrown.

Different methods on the same path are merged into a single path item:

```ts
// Document A has: GET /users
// Document B has: POST /users
// Result: /users with both GET and POST operations
```

### Component Schemas

Schemas from `components.schemas` are merged across all documents. If two documents define a schema with the same name, a `ToOpenapiError` with code `DUPLICATE_SCHEMA` is thrown.

### Security Schemes

Security schemes from `components.securitySchemes` are merged across all documents. If two documents define a security scheme with the same name, a `ToOpenapiError` with code `DUPLICATE_SCHEMA` is thrown.

### Tags

Tags are merged by name. When the same tag name appears in multiple documents, the first occurrence wins (base document takes priority, then sources in order).

### Servers

The `servers` array from the base document takes priority. If the base has no `servers`, the first source document that has `servers` is used.

### Security

The global `security` array from the base document takes priority. If the base has no `security`, the first source document that has `security` is used.

### Info and OpenAPI Version

The `info` object and `openapi` version string always come from the base document and are never overridden by sources.

### External Docs

The `externalDocs` value from the base document is used if present. Source documents' `externalDocs` are not merged.

## Merge Priority Summary

| Field | Behavior |
|-------|----------|
| `openapi` | Always from base |
| `info` | Always from base |
| `paths` | Merged; duplicate method+path throws `DUPLICATE_PATH` |
| `components.schemas` | Merged; duplicate names throw `DUPLICATE_SCHEMA` |
| `components.securitySchemes` | Merged; duplicate names throw `DUPLICATE_SCHEMA` |
| `tags` | Merged by name; first occurrence wins |
| `servers` | Base takes priority, else first source with servers |
| `security` | Base takes priority, else first source with security |
| `externalDocs` | From base only |

## Example

```ts
import { openapi, merge } from 'to-openapi'
import { z } from 'zod'

// Users service
const usersApi = openapi({
  info: { title: 'Users API', version: '1.0.0' },
  tags: [{ name: 'users', description: 'User management' }],
  paths: {
    'GET /users': {
      summary: 'List users',
      tags: ['users'],
      200: z.array(z.object({ id: z.string(), name: z.string() })),
    },
    'POST /users': {
      summary: 'Create user',
      tags: ['users'],
      body: z.object({ name: z.string(), email: z.string() }),
      201: z.object({ id: z.string(), name: z.string() }),
    },
  },
})

// Orders service
const ordersApi = openapi({
  info: { title: 'Orders API', version: '1.0.0' },
  tags: [{ name: 'orders', description: 'Order management' }],
  paths: {
    'GET /orders': {
      summary: 'List orders',
      tags: ['orders'],
      200: z.array(z.object({ id: z.string(), total: z.number() })),
    },
    'POST /orders': {
      summary: 'Create order',
      tags: ['orders'],
      body: z.object({ items: z.array(z.string()) }),
      201: z.object({ id: z.string(), total: z.number() }),
    },
  },
})

// Merge into a single gateway API
const gatewayApi = merge(
  {
    openapi: '3.1.0',
    info: { title: 'Gateway API', version: '1.0.0' },
    paths: {},
    servers: [{ url: 'https://api.example.com' }],
  },
  usersApi,
  ordersApi,
)

// gatewayApi now contains all paths from both services,
// uses the gateway's info/servers, and merges tags from both.
```

## Error Handling

```ts
import { merge, ToOpenapiError } from 'to-openapi'

try {
  const merged = merge(docA, docB)
} catch (error) {
  if (error instanceof ToOpenapiError) {
    if (error.code === 'DUPLICATE_PATH') {
      console.error('Conflicting route:', error.message)
    }
    if (error.code === 'DUPLICATE_SCHEMA') {
      console.error('Conflicting schema or security scheme:', error.message)
    }
  }
}
```
