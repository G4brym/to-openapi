# to-openapi

[![npm version](https://img.shields.io/npm/v/to-openapi)](https://www.npmjs.com/package/to-openapi)
[![npm downloads](https://img.shields.io/npm/dm/to-openapi)](https://www.npmjs.com/package/to-openapi)
[![license](https://img.shields.io/npm/l/to-openapi)](https://github.com/G4brym/to-openapi/blob/main/LICENSE)

Generate OpenAPI 3.1 specs from any TypeScript schema library — Zod, ArkType, Valibot, and more.

## Features

- **Schema-agnostic** — Works with any library that implements [Standard Schema](https://github.com/standard-schema/standard-schema) (Zod, ArkType, Valibot, etc.)
- **Two APIs** — Declarative `openapi()` function or chainable `OpenAPI` class builder
- **Plugin system** — Transform routes, schemas, and documents with composable plugins
- **Spec merging** — Combine multiple OpenAPI documents with `merge()` for microservices
- **Type-safe** — Full TypeScript support with exported types for every concept

## Install

```bash
npm install to-openapi
```

## Quick Start

### Declarative API

```ts
import { openapi } from 'to-openapi'

const spec = openapi({
  info: { title: 'My API', version: '1.0.0' },
  paths: {
    'GET /users': {
      200: UserSchema,
    },
    'POST /users': {
      body: CreateUserSchema,
      201: UserSchema,
    },
    'GET /users/:id': {
      200: UserSchema,
      404: null,
    },
  },
})
```

### Class Builder API

```ts
import { OpenAPI } from 'to-openapi'

const spec = new OpenAPI({
  info: { title: 'My API', version: '1.0.0' },
})
  .schema('User', UserSchema)
  .route('get', '/users', {
    200: UserSchema,
  })
  .route('post', '/users', {
    body: CreateUserSchema,
    201: UserSchema,
  })
  .route('get', '/users/{id}', {
    200: UserSchema,
    404: null,
  })
  .document()
```

Both produce a fully valid OpenAPI 3.1.0 document with schemas automatically extracted to `components/schemas` and referenced via `$ref`.

## Documentation

Visit the [documentation site](https://to-openapi.massadas.com) for the full guide, API reference, framework integrations, plugin authoring, and examples.

- [Why to-openapi?](https://to-openapi.massadas.com/guide/why)
- [Getting Started](https://to-openapi.massadas.com/guide/getting-started)
- [API Reference](https://to-openapi.massadas.com/api/openapi-function)
- [Plugins](https://to-openapi.massadas.com/plugins/overview)
- [Examples](https://to-openapi.massadas.com/examples/crud-api)

## Contributing

Contributions are welcome! Please open an issue or pull request on [GitHub](https://github.com/G4brym/to-openapi).

## License

[MIT](./LICENSE)
