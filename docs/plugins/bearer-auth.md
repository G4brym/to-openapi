# Bearer Auth Plugin

The Bearer Auth plugin adds HTTP bearer token authentication to your OpenAPI document. It attaches a security requirement to every route (with optional exclusions), registers a `securityScheme` in `components`, and sets global `security` on the document.

## Installation

The plugin is included with `to-openapi` -- no extra packages needed.

```ts
import { bearerAuth } from 'to-openapi/plugins/bearer-auth';
```

## Basic Usage

```ts
import { openapi } from 'to-openapi';
import { bearerAuth } from 'to-openapi/plugins/bearer-auth';

const doc = openapi({
  info: { title: 'My API', version: '1.0.0' },
  plugins: [bearerAuth()],
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

With the default configuration, every route in the document will require a bearer token.

## Options

The plugin accepts an optional `BearerAuthOptions` object:

```ts
export interface BearerAuthOptions {
  schemeName?: string;
  bearerFormat?: string;
  description?: string;
  exclude?: string[];
}
```

| Option         | Type       | Default        | Description                                                      |
| -------------- | ---------- | -------------- | ---------------------------------------------------------------- |
| `schemeName`   | `string`   | `"bearerAuth"` | The name used for the security scheme in `components.securitySchemes` and in route `security` arrays. |
| `bearerFormat` | `string`   | --             | An optional hint for the token format (e.g., `"JWT"`). Appears in the generated security scheme object. |
| `description`  | `string`   | --             | A human-readable description for the security scheme.            |
| `exclude`      | `string[]` | `[]`           | An array of route paths to exclude from the security requirement. Routes matching these paths will not have `security` applied. |

## Example with Options

```ts
import { openapi } from 'to-openapi';
import { bearerAuth } from 'to-openapi/plugins/bearer-auth';

const doc = openapi({
  info: { title: 'My API', version: '1.0.0' },
  plugins: [
    bearerAuth({
      schemeName: 'jwt',
      bearerFormat: 'JWT',
      description: 'JSON Web Token issued by the auth service',
    }),
  ],
  paths: {
    'GET /users': {
      200: UserListSchema,
    },
  },
});
```

This produces a security scheme named `jwt` with `bearerFormat: "JWT"` in the output document:

```json
{
  "components": {
    "securitySchemes": {
      "jwt": {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT",
        "description": "JSON Web Token issued by the auth service"
      }
    }
  },
  "security": [{ "jwt": [] }]
}
```

## Excluding Routes

Public endpoints (login, health checks, etc.) can be excluded by passing their paths to the `exclude` option:

```ts
import { openapi } from 'to-openapi';
import { bearerAuth } from 'to-openapi/plugins/bearer-auth';

const doc = openapi({
  info: { title: 'My API', version: '1.0.0' },
  plugins: [
    bearerAuth({
      exclude: ['/auth/login', '/health'],
    }),
  ],
  paths: {
    'POST /auth/login': {
      body: LoginSchema,
      200: TokenSchema,
    },
    'GET /health': {
      200: null,
    },
    'GET /users': {
      200: UserListSchema,
    },
  },
});
```

In this example:

- `POST /auth/login` and `GET /health` will **not** have a `security` requirement on their operations.
- `GET /users` will include `security: [{ "bearerAuth": [] }]`.

## How It Works

The plugin uses two hooks:

1. **`transformRoute`** -- For each route, it checks whether the route's path is in the `exclude` list. If the route is excluded or already has a `security` property, it is left untouched. Otherwise, the plugin adds `security: [{ [schemeName]: [] }]` to the route.

2. **`transformDocument`** -- After the document is assembled, the plugin adds a `securityScheme` entry under `components.securitySchemes` and sets `security` at the document root (if not already present). This ensures tools like Swagger UI display the "Authorize" button.

## Combining with Other Plugins

The Bearer Auth plugin works well alongside other plugins. Plugin order matters -- place `bearerAuth` before plugins that depend on the `security` field being set:

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
      { status: 401, description: 'Unauthorized' },
    ]),
  ],
  paths: {
    'GET /users': { 200: UserListSchema },
    'GET /health': { 200: null },
  },
});
```

## Related

- [Plugin Overview](./overview.md) -- how plugins work and execution order
- [Auto Tags Plugin](./auto-tags.md) -- automatic tagging based on path segments
- [Error Responses Plugin](./error-responses.md) -- add common error responses
- [Authoring Plugins](./authoring.md) -- create your own plugins
