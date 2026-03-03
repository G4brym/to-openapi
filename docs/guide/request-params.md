# Request Parameters

to-openapi supports four kinds of request parameters: query, path, header, and cookie. Each is defined by providing an object schema whose properties become individual parameters.

## Query Parameters

Provide an object schema to the `query` field. Each property of the schema becomes a separate query parameter.

```ts
import { openapi } from 'to-openapi'
import { z } from 'zod'

const doc = openapi({
  info: { title: 'API', version: '1.0.0' },
  paths: {
    'GET /users': {
      query: z.object({
        page: z.number(),
        limit: z.number().optional(),
        search: z.string().optional(),
      }),
      200: UserListSchema,
    },
  },
})
```

This produces three query parameters: `page` (required), `limit` (optional), and `search` (optional). Required vs optional is determined by the `required` array in the resolved JSON Schema.

## Path Parameters

Path parameters are automatically detected from `:param` or `{param}` segments in the route path. By default, they are typed as `{ type: "string" }` and marked `required: true`.

```ts
'GET /users/:id': {
  200: UserSchema,
}
```

This produces a path parameter `id` with `type: "string"`, `in: "path"`, `required: true`.

### Custom Path Parameter Types

Provide an object schema to `params` to override the default typing:

```ts
'GET /users/:id': {
  params: z.object({
    id: z.string().uuid(),
  }),
  200: UserSchema,
}
```

Now the `id` parameter has the UUID format from your schema instead of a plain string. Path parameters are always `required: true` regardless of the schema.

### Mixed Detection

If your path has parameters not covered by the `params` schema, they are still included with the default `{ type: "string" }` typing:

```ts
'GET /orgs/:orgId/users/:userId': {
  params: z.object({
    userId: z.string().uuid(),
  }),
  200: UserSchema,
}
```

This produces two path parameters: `orgId` with default string typing, and `userId` with UUID typing from the schema.

## Header Parameters

Provide an object schema to `headers`. Each property becomes a header parameter.

```ts
'GET /protected': {
  headers: z.object({
    'x-api-key': z.string(),
    'x-request-id': z.string().optional(),
  }),
  200: DataSchema,
}
```

This produces two header parameters: `x-api-key` (required) and `x-request-id` (optional).

## Cookie Parameters

Provide an object schema to `cookies`. Each property becomes a cookie parameter.

```ts
'GET /dashboard': {
  cookies: z.object({
    session_id: z.string(),
    theme: z.string().optional(),
  }),
  200: DashboardSchema,
}
```

This produces two cookie parameters: `session_id` (required) and `theme` (optional).

## Deprecated Parameters

If a property in your parameter schema includes `deprecated: true`, it propagates to the generated OpenAPI parameter. This works for query, path, header, and cookie parameters.

```ts
'GET /users': {
  query: z.object({
    oldFilter: z.string().openapi({ deprecated: true }),
    filter: z.string(),
  }),
  200: UserListSchema,
}
```

The `oldFilter` parameter will have `deprecated: true` in the OpenAPI output. The mechanism depends on your schema library — the property must resolve to a JSON Schema with `deprecated: true`.

## Required Fields

Whether a parameter is required depends on its presence in the JSON Schema `required` array:

- **Query parameters**: required if listed in the schema's `required` array; optional otherwise.
- **Path parameters**: always `required: true`, regardless of the schema.
- **Header parameters**: required if listed in the schema's `required` array; optional otherwise.
- **Cookie parameters**: required if listed in the schema's `required` array; optional otherwise.

In Zod, calling `.optional()` on a property removes it from the `required` array. Other schema libraries have equivalent mechanisms.

## Complete Example

```ts
import { openapi } from 'to-openapi'
import { z } from 'zod'

const UpdateUserBody = z.object({
  name: z.string(),
  email: z.string().email(),
})

const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
})

const doc = openapi({
  info: { title: 'User API', version: '1.0.0' },
  paths: {
    'PUT /orgs/:orgId/users/:userId': {
      params: z.object({
        orgId: z.string().uuid(),
        userId: z.string().uuid(),
      }),
      query: z.object({
        dryRun: z.boolean().optional(),
      }),
      headers: z.object({
        'x-idempotency-key': z.string(),
      }),
      cookies: z.object({
        session_id: z.string(),
      }),
      body: UpdateUserBody,
      200: UserSchema,
      400: null,
    },
  },
})
```

This produces:

- Two path parameters: `orgId` and `userId` (both UUID, both required)
- One query parameter: `dryRun` (optional boolean)
- One header parameter: `x-idempotency-key` (required string)
- One cookie parameter: `session_id` (required string)
- A JSON request body with the `UpdateUserBody` schema
- Two responses: 200 with the User schema, 400 with no body

## Related

- [Route Shorthand](/guide/shorthand) -- all fields in a route definition
- [Schemas & $ref](/guide/schemas) -- how schemas are resolved and deduplicated
- [Responses](/guide/responses) -- all response definition styles
