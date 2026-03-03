# Error Responses Plugin

The Error Responses plugin adds common error responses (400, 401, 500, etc.) to every route that does not already define them. This avoids repetitive boilerplate when most of your endpoints share the same set of error cases.

## Installation

The plugin is included with `to-openapi` -- no extra packages needed.

```ts
import { errorResponses } from 'to-openapi/plugins/error-responses';
```

## Basic Usage

Pass an array of `ErrorResponseEntry` objects describing the error status codes you want applied globally:

```ts
import { openapi } from 'to-openapi';
import { errorResponses } from 'to-openapi/plugins/error-responses';

const doc = openapi({
  info: { title: 'My API', version: '1.0.0' },
  plugins: [
    errorResponses([
      { status: 400, description: 'Bad Request' },
      { status: 401, description: 'Unauthorized' },
      { status: 500, description: 'Internal Server Error' },
    ]),
  ],
  paths: {
    'GET /users': {
      200: UserListSchema,
    },
    'POST /users': {
      body: CreateUserSchema,
      201: UserSchema,
    },
  },
});
```

Both `GET /users` and `POST /users` will now include `400`, `401`, and `500` responses in addition to their success responses.

## The `ErrorResponseEntry` Interface

```ts
export interface ErrorResponseEntry {
  status: number;
  schema?: StandardJSONSchemaV1;
  description?: string;
}
```

| Field         | Type                  | Required | Description                                                                 |
| ------------- | --------------------- | -------- | --------------------------------------------------------------------------- |
| `status`      | `number`              | Yes      | The HTTP status code (e.g., `400`, `401`, `404`, `500`).                   |
| `schema`      | `StandardJSONSchemaV1`| No       | A Standard JSON Schema for the error response body. When provided, the response will include a `content` section with `application/json`. |
| `description` | `string`              | No       | A human-readable description for the response. Used when no `schema` is provided. |

Each entry produces a different kind of response depending on what fields are set:

- **`schema` provided** -- The response includes a JSON body with the given schema.
- **`description` only** -- The response has a description but no body content.
- **Neither** -- The response is added with a `null` value, which produces a description-only response using the default status text.

## Example with Error Schemas

You can provide full schemas for structured error responses:

```ts
import { openapi } from 'to-openapi';
import { errorResponses } from 'to-openapi/plugins/error-responses';
import { z } from 'zod';

const ErrorBody = z.object({
  code: z.string(),
  message: z.string(),
  details: z.array(z.string()).optional(),
});

const doc = openapi({
  info: { title: 'My API', version: '1.0.0' },
  plugins: [
    errorResponses([
      { status: 400, schema: ErrorBody },
      { status: 401, description: 'Unauthorized -- missing or invalid token' },
      { status: 500, schema: ErrorBody },
    ]),
  ],
  paths: {
    'GET /users': {
      200: UserListSchema,
    },
  },
});
```

In this example:

- `400` and `500` responses will include a JSON body matching `ErrorBody`.
- `401` will have only a description string, with no response body schema.

## Override Behavior

The plugin **never overwrites** responses that a route already defines. If a route already has a given status code, that entry is skipped for that route:

```ts
import { openapi } from 'to-openapi';
import { errorResponses } from 'to-openapi/plugins/error-responses';

const doc = openapi({
  info: { title: 'My API', version: '1.0.0' },
  plugins: [
    errorResponses([
      { status: 400, description: 'Bad Request' },
      { status: 404, description: 'Not Found' },
    ]),
  ],
  paths: {
    'GET /users/{id}': {
      200: UserSchema,
      404: CustomNotFoundSchema,   // Route already defines 404
    },
    'GET /users': {
      200: UserListSchema,
      // No 400 or 404 defined here
    },
  },
});
```

Result:

- **`GET /users/{id}`** -- Gets the plugin's `400` response added, but its own `404: CustomNotFoundSchema` is preserved (the plugin's `404` is skipped).
- **`GET /users`** -- Gets both `400` and `404` from the plugin, since neither was defined on the route.

This makes it safe to use the plugin broadly while retaining fine-grained control over individual routes.

## Using with the Class-based API

```ts
import { OpenAPI } from 'to-openapi';
import { errorResponses } from 'to-openapi/plugins/error-responses';

const api = new OpenAPI({
  info: { title: 'My API', version: '1.0.0' },
  plugins: [
    errorResponses([
      { status: 400, description: 'Bad Request' },
      { status: 500, description: 'Internal Server Error' },
    ]),
  ],
});

api.route('get', '/users', { 200: UserListSchema });
api.route('get', '/users/:id', { 200: UserSchema, 400: ValidationErrorSchema });

const doc = api.document();
// GET /users gets both 400 and 500 from the plugin
// GET /users/:id gets only 500 (its own 400 is preserved)
```

## Combining with Other Plugins

The Error Responses plugin is typically placed last in the plugins array, so other plugins (like [Bearer Auth](./bearer-auth.md)) can modify routes first:

```ts
import { openapi } from 'to-openapi';
import { bearerAuth } from 'to-openapi/plugins/bearer-auth';
import { autoTags } from 'to-openapi/plugins/auto-tags';
import { errorResponses } from 'to-openapi/plugins/error-responses';

const doc = openapi({
  info: { title: 'My API', version: '1.0.0' },
  plugins: [
    bearerAuth({ bearerFormat: 'JWT' }),
    autoTags(),
    errorResponses([
      { status: 400, description: 'Bad Request' },
      { status: 401, description: 'Unauthorized' },
      { status: 403, description: 'Forbidden' },
      { status: 500, description: 'Internal Server Error' },
    ]),
  ],
  paths: {
    'GET /users': { 200: UserListSchema },
    'POST /users': { body: CreateUserSchema, 201: UserSchema },
  },
});
```

## Related

- [Plugin Overview](./overview.md) -- how plugins work and execution order
- [Bearer Auth Plugin](./bearer-auth.md) -- add bearer token authentication
- [Auto Tags Plugin](./auto-tags.md) -- automatic tagging based on path segments
- [Authoring Plugins](./authoring.md) -- create your own plugins
