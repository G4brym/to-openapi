# Composing Specs

The `merge()` function combines multiple OpenAPI documents into one. This enables modular spec construction -- build specs per-service, per-team, or per-domain and merge them at the boundary.

## Basic Usage

```ts
import { merge } from 'to-openapi'

const combined = merge(base, usersSpec, ordersSpec)
```

The first argument is the **base** document. Its `openapi` version, `info`, `servers`, `security`, and `externalDocs` are preserved in the output. Subsequent arguments are **source** documents whose paths, schemas, security schemes, and tags are merged in.

## Import

```ts
import { merge } from 'to-openapi'
```

## Merge Rules

### Paths

Paths are merged method-by-method. If the same path exists in multiple documents, their methods are combined into a single path item.

```ts
// usersSpec has: GET /users, POST /users
// adminSpec has: DELETE /users/:id

const combined = merge(usersSpec, adminSpec)
// combined has: GET /users, POST /users, DELETE /users/{id}
```

If two documents define the same method on the same path, a `DUPLICATE_PATH` error is thrown:

```ts
// Both define GET /users -- this throws
merge(specA, specB)
// ToOpenapiError: Duplicate operation: GET /users
```

### Component Schemas

Schemas from `components/schemas` are merged. Duplicate schema names throw a `DUPLICATE_SCHEMA` error:

```ts
// Both define components.schemas.User -- this throws
merge(specA, specB)
// ToOpenapiError: Duplicate component schema: "User"
```

### Security Schemes

Security schemes from `components/securitySchemes` follow the same rule -- duplicates throw a `DUPLICATE_SCHEMA` error.

### Tags

Tags are merged by name. If the same tag name appears in multiple documents, only the first occurrence is kept. No error is thrown.

```ts
// Both have a tag named "users"
// The tag definition from the base is preserved
merge(base, source)
```

### Servers and Security

The base document's `servers` and `security` arrays are used. If the base has no `servers`, the first source with `servers` provides them. Same for `security`.

## Microservices Example

Build separate specs per service and merge them into a single API gateway spec:

```ts
import { openapi, merge } from 'to-openapi'
import { z } from 'zod'

// --- Users service ---
const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
})

const usersSpec = openapi({
  info: { title: 'Users', version: '1.0.0' },
  schemas: { User: UserSchema },
  tags: [{ name: 'users' }],
  paths: {
    'GET /users': {
      tags: ['users'],
      200: UserSchema,
    },
    'POST /users': {
      tags: ['users'],
      body: UserSchema,
      201: UserSchema,
    },
  },
})

// --- Orders service ---
const OrderSchema = z.object({
  id: z.string(),
  userId: z.string(),
  total: z.number(),
})

const ordersSpec = openapi({
  info: { title: 'Orders', version: '1.0.0' },
  schemas: { Order: OrderSchema },
  tags: [{ name: 'orders' }],
  paths: {
    'GET /orders': {
      tags: ['orders'],
      200: OrderSchema,
    },
    'POST /orders': {
      tags: ['orders'],
      body: OrderSchema,
      201: OrderSchema,
    },
  },
})

// --- Merge into gateway spec ---
const gatewayBase = openapi({
  info: { title: 'API Gateway', version: '1.0.0' },
  servers: [{ url: 'https://api.example.com' }],
  paths: {},
})

const gatewaySpec = merge(gatewayBase, usersSpec, ordersSpec)
// gatewaySpec has all 4 routes, both schemas, both tags,
// and uses the gateway's info and servers.
```

## Error Handling

`merge()` throws `ToOpenapiError` with specific error codes:

| Error Code | Cause |
|---|---|
| `DUPLICATE_PATH` | Same HTTP method + path defined in multiple documents |
| `DUPLICATE_SCHEMA` | Same component schema or security scheme name in multiple documents |

```ts
import { ToOpenapiError } from 'to-openapi'

try {
  const combined = merge(specA, specB)
} catch (err) {
  if (err instanceof ToOpenapiError) {
    console.error(err.code, err.message)
  }
}
```

## Related

- [Getting Started](/guide/getting-started) -- building individual specs
- [Schemas & $ref](/guide/schemas) -- how schemas are named and deduplicated
- [TypeScript](/guide/typescript) -- types for merge inputs and outputs
