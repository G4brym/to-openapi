---
name: generate-spec
description: Generate an OpenAPI specification for your API using to-openapi. Use when the user wants to create an OpenAPI spec, document their API, or set up to-openapi in their project.
---

# Generate OpenAPI Spec

Generate an OpenAPI 3.1 specification for the user's API using the `to-openapi` library.

## Steps

1. **Discover routes**: Search the codebase for API route definitions (Express, Hono, Fastify, Cloudflare Workers, or any HTTP framework). Look for patterns like `app.get()`, `app.post()`, `router.get()`, `Hono` routes, `fetch` handlers, etc.

2. **Discover schemas**: Find existing schema definitions (Zod, ArkType, Valibot, or any Standard Schema library). Look for imports from `zod`, `arktype`, `valibot`, or similar.

3. **Generate the spec file**: Create a file (e.g. `openapi.ts` or `spec.ts`) that:
   - Imports `openapi` from `to-openapi`
   - Imports the user's existing schemas
   - Maps discovered routes to the `paths` object using route shorthand format (`"METHOD /path"`)
   - Registers named schemas via the `schemas` option for reuse with `$ref`
   - Includes appropriate `info` (title, version, description)
   - Adds `servers` if base URLs are discoverable

4. **Route shorthand format**:
   - Keys: `"GET /users"`, `"POST /users/:id"` (`:param` is auto-converted to `{param}`)
   - Query params: `query: myZodObjectSchema`
   - Path params: `params: myZodObjectSchema`
   - Request body: `body: myZodSchema`
   - Responses: `200: myResponseSchema`, `404: null`, `201: 'NamedSchema'`
   - Metadata: `summary`, `description`, `tags`, `operationId`, `deprecated`, `security`

5. **Add a serve route**: Add a route to the user's app that serves the spec at `GET /openapi.json`:
   ```ts
   // For Express
   app.get('/openapi.json', (req, res) => res.json(spec))

   // For Hono
   app.get('/openapi.json', (c) => c.json(spec))

   // For Fastify
   fastify.get('/openapi.json', () => spec)
   ```

6. **Add plugins** if appropriate:
   - `bearerAuth()` from `to-openapi/plugins/bearer-auth` — if the API uses JWT/bearer auth
   - `autoTags()` from `to-openapi/plugins/auto-tags` — to auto-tag routes by path prefix
   - `errorResponses(...)` from `to-openapi/plugins/error-responses` — for common error codes

## API Reference

### `openapi()` function (declarative)

```ts
import { openapi } from 'to-openapi'

const spec = openapi({
  info: { title: 'My API', version: '1.0.0' },
  schemas: {
    User: UserSchema,   // Named schemas → components/schemas
  },
  paths: {
    'GET /users': {
      query: PaginationSchema,
      200: UserListSchema,
    },
    'POST /users': {
      body: CreateUserSchema,
      201: 'User',        // String = reference to named schema
    },
    'GET /users/:id': {
      200: 'User',
      404: null,           // null = no response body
    },
  },
})
```

### `OpenAPI` class (builder, for dynamic/multi-file setups)

```ts
import { OpenAPI } from 'to-openapi'

const api = new OpenAPI({ info: { title: 'My API', version: '1.0.0' } })
  .schema('User', UserSchema)
  .route('get', '/users', { 200: UserListSchema })
  .route('post', '/users', { body: CreateUserSchema, 201: 'User' })

const spec = api.document()
```

### `extend()` — add OpenAPI metadata to schemas

```ts
import { extend } from 'to-openapi'

const EnhancedSchema = extend(MySchema, {
  description: 'A user object',
  example: { id: '123', name: 'Alice' },
})
```

## Important

- Ensure `to-openapi` is installed: `npm install to-openapi`
- The user's schema library must implement Standard Schema (Zod >=3.24, ArkType >=2, Valibot >=1)
- Route methods are case-insensitive in shorthand keys
- The generated spec is a frozen object — use `JSON.stringify(spec, null, 2)` to serialize
