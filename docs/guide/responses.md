# Responses

Response definitions in to-openapi are set using numeric status code keys on the route shorthand. This page covers all supported response formats.

## Status Code Keys

Use numeric keys like `200`, `201`, `204`, `400`, `404`, `500` on the route definition. Any integer from 100 to 599 is accepted.

```ts
'GET /pets': {
  200: PetListSchema,
  404: null,
  500: ErrorSchema,
}
```

Each status code is given a default description based on the HTTP standard (e.g., `200` becomes `"Successful response"`, `404` becomes `"Not found"`).

## Schema Responses

Pass a Standard Schema object to a status code key. The schema is resolved to JSON Schema and wrapped in `application/json` content:

```ts
'GET /pets/:id': {
  200: PetSchema,
}
```

Produces:

```json
{
  "200": {
    "description": "Successful response",
    "content": {
      "application/json": {
        "schema": { "$ref": "#/components/schemas/Pet" }
      }
    }
  }
}
```

Whether the schema is inlined or promoted to a `$ref` depends on naming and usage count. See [Schemas & $ref](/guide/schemas).

## Null Responses

Pass `null` to define a response with no body. This is common for `204 No Content` or `404 Not Found` responses that only need a status code and description.

```ts
'DELETE /pets/:id': {
  204: null,
}
```

Produces:

```json
{
  "204": {
    "description": "No content"
  }
}
```

## String References

Pass a string to reference a named schema by name. The schema must be registered via the `schemas` option or the `.schema()` method.

```ts
const doc = openapi({
  info: { title: 'API', version: '1.0.0' },
  schemas: { Pet: PetSchema, Error: ErrorSchema },
  paths: {
    'GET /pets/:id': {
      200: 'Pet',
      404: 'Error',
    },
  },
})
```

The string `'Pet'` resolves to `{ $ref: '#/components/schemas/Pet' }` and is wrapped in `application/json` content. If the name does not match a registered schema, a `SCHEMA_RESOLUTION_FAILED` error is thrown.

## ResponseObject Passthrough

Pass a full OpenAPI `ResponseObject` for complete control. The object must have a `description` or `content` property (and must not have a `~standard` property).

```ts
'GET /pets/:id': {
  200: {
    description: 'A single pet',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/Pet' },
      },
      'application/xml': {
        schema: { $ref: '#/components/schemas/Pet' },
      },
    },
  },
}
```

This is passed through to the OpenAPI output as-is. Use this when you need multiple content types, custom headers, or links in a response.

## Multiple Status Codes

A single route can define multiple responses:

```ts
import { openapi } from 'to-openapi'
import { z } from 'zod'

const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
})

const ErrorSchema = z.object({
  message: z.string(),
})

const doc = openapi({
  info: { title: 'User API', version: '1.0.0' },
  schemas: { User: UserSchema, Error: ErrorSchema },
  paths: {
    'POST /users': {
      body: UserSchema,
      201: UserSchema,
      400: ErrorSchema,
      409: 'Error',
      422: {
        description: 'Validation failed',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
          },
        },
      },
      500: null,
    },
  },
})
```

This demonstrates all four response styles in a single route: schema object (`201`, `400`), string reference (`409`), full ResponseObject (`422`), and null (`500`).

## Default Descriptions

Status codes are automatically mapped to standard descriptions:

| Code | Description |
|---|---|
| 200 | Successful response |
| 201 | Resource created |
| 204 | No content |
| 400 | Bad request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not found |
| 409 | Conflict |
| 422 | Unprocessable entity |
| 429 | Too many requests |
| 500 | Internal server error |

For unrecognized status codes, the description defaults to `"Response {code}"`.

## Related

- [Schemas & $ref](/guide/schemas) -- how schemas become `$ref` references
- [Route Shorthand](/guide/shorthand) -- all fields in a route definition
- [Request Parameters](/guide/request-params) -- query, path, and header parameters
