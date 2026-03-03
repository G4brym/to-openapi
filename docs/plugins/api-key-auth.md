# API Key Auth

The `apiKeyAuth` plugin adds API key authentication to your OpenAPI document. It automatically applies security requirements to all routes and registers the security scheme.

## Installation

Included with `to-openapi` — no additional packages needed.

```ts
import { apiKeyAuth } from 'to-openapi/plugins/api-key-auth'
```

## Basic Usage

```ts
import { openapi } from 'to-openapi'
import { apiKeyAuth } from 'to-openapi/plugins/api-key-auth'

const doc = openapi({
  info: { title: 'My API', version: '1.0.0' },
  plugins: [
    apiKeyAuth({ name: 'X-API-Key', in: 'header' }),
  ],
  paths: {
    'GET /tasks': { 200: TaskListSchema },
    'POST /tasks': { body: CreateTaskSchema, 201: TaskSchema },
  },
})
```

This adds `security: [{ apiKeyAuth: [] }]` to every route and registers an `apiKey` security scheme in `components.securitySchemes`.

## Options

The `ApiKeyAuthOptions` interface:

| Option | Type | Default | Description |
|---|---|---|---|
| `name` | `string` | _(required)_ | The name of the header, query parameter, or cookie that carries the API key |
| `in` | `"header" \| "query" \| "cookie"` | _(required)_ | Where the API key is sent |
| `schemeName` | `string` | `"apiKeyAuth"` | Name used in `securitySchemes` and `security` arrays |
| `description` | `string` | — | Description for the security scheme |
| `exclude` | `string[]` | `[]` | Paths to exclude from automatic security injection |

## Example with Options

```ts
apiKeyAuth({
  schemeName: 'projectKey',
  name: 'X-Project-Key',
  in: 'header',
  description: 'Project-scoped API key',
})
```

## Excluding Routes

Use the `exclude` option to skip security on specific paths:

```ts
apiKeyAuth({
  name: 'X-API-Key',
  in: 'header',
  exclude: ['/auth/login', '/health'],
})
```

Excluded routes will not have security injected. Routes that already have a `security` field are also left unchanged.

## How It Works

The plugin uses two hooks:

1. **`transformRoute`** — Adds `security: [{ [schemeName]: [] }]` to each route, unless the route is excluded or already has security defined.
2. **`transformDocument`** — Registers the `apiKey` security scheme in `components.securitySchemes` and sets global `security` if not already present.

## Combining with Other Plugins

```ts
import { apiKeyAuth } from 'to-openapi/plugins/api-key-auth'
import { autoTags } from 'to-openapi/plugins/auto-tags'

const doc = openapi({
  info: { title: 'API', version: '1.0.0' },
  plugins: [
    apiKeyAuth({ name: 'X-API-Key', in: 'header' }),
    autoTags(),
  ],
  paths: { /* ... */ },
})
```

Plugin order matters — plugins run in array order. Place the auth plugin first if other plugins depend on the `security` field being set.

## Related

- [Bearer Auth](/plugins/bearer-auth) — HTTP bearer token authentication
- [Plugin Overview](/plugins/overview) — how the plugin system works
- [Authoring Plugins](/plugins/authoring) — create your own plugins
