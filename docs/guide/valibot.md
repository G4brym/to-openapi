# Valibot

[Valibot](https://valibot.dev) is a modular, tree-shakeable schema validation library. Valibot v1.x implements the Standard Schema `~standard.validate` interface but does **not** include `~standard.jsonSchema` natively. You need the official [`@valibot/to-json-schema`](https://github.com/fabian-hiller/valibot/tree/main/packages/to-json-schema) package to bridge the gap.

## Installation

```bash
npm install valibot @valibot/to-json-schema
```

## Why the Wrapper?

to-openapi reads JSON Schema from `schema["~standard"].jsonSchema`. Zod and ArkType provide this natively, but Valibot v1.x only ships `~standard.validate` for runtime validation.

The `@valibot/to-json-schema` package provides a `toStandardJsonSchema()` function that wraps a Valibot schema and adds the `~standard.jsonSchema` interface. **Every Valibot schema must be wrapped before passing it to `openapi()`.**

```ts
import * as v from "valibot";
import { toStandardJsonSchema } from "@valibot/to-json-schema";

// Raw Valibot schema -- missing ~standard.jsonSchema
const raw = v.object({ name: v.string() });

// Wrapped -- now compatible with to-openapi
const schema = toStandardJsonSchema(raw);
```

## Defining Schemas

```ts
import * as v from "valibot";
import { toStandardJsonSchema } from "@valibot/to-json-schema";

const UserSchema = toStandardJsonSchema(
  v.object({
    id: v.pipe(v.string(), v.uuid()),
    name: v.pipe(v.string(), v.minLength(1)),
    email: v.pipe(v.string(), v.email()),
    role: v.picklist(["admin", "user", "guest"]),
    bio: v.optional(v.string()),
    createdAt: v.pipe(v.string(), v.isoTimestamp()),
  }),
);

const CreateUserSchema = toStandardJsonSchema(
  v.object({
    name: v.pipe(v.string(), v.minLength(1)),
    email: v.pipe(v.string(), v.email()),
    role: v.picklist(["admin", "user", "guest"]),
  }),
);

const ErrorSchema = toStandardJsonSchema(
  v.object({
    message: v.string(),
    code: v.string(),
  }),
);
```

## Using with to-openapi

Pass wrapped Valibot schemas to `openapi()` -- the call structure is identical to Zod or ArkType:

```ts
import * as v from "valibot";
import { toStandardJsonSchema } from "@valibot/to-json-schema";
import { openapi } from "to-openapi";

const UserSchema = toStandardJsonSchema(
  v.object({
    id: v.pipe(v.string(), v.uuid()),
    name: v.pipe(v.string(), v.minLength(1)),
    email: v.pipe(v.string(), v.email()),
    createdAt: v.pipe(v.string(), v.isoTimestamp()),
  }),
);

const CreateUserSchema = toStandardJsonSchema(
  v.object({
    name: v.pipe(v.string(), v.minLength(1)),
    email: v.pipe(v.string(), v.email()),
  }),
);

const UpdateUserSchema = toStandardJsonSchema(
  v.object({
    name: v.optional(v.pipe(v.string(), v.minLength(1))),
    email: v.optional(v.pipe(v.string(), v.email())),
  }),
);

const ErrorSchema = toStandardJsonSchema(
  v.object({
    message: v.string(),
    code: v.string(),
  }),
);

const spec = openapi({
  info: {
    title: "User Service",
    version: "1.0.0",
  },
  schemas: {
    User: UserSchema,
    CreateUser: CreateUserSchema,
    UpdateUser: UpdateUserSchema,
    Error: ErrorSchema,
  },
  paths: {
    "GET /users": {
      summary: "List users",
      tags: ["Users"],
      200: UserSchema,
    },
    "POST /users": {
      summary: "Create user",
      tags: ["Users"],
      body: CreateUserSchema,
      201: UserSchema,
      400: ErrorSchema,
    },
    "GET /users/{id}": {
      summary: "Get user by ID",
      tags: ["Users"],
      200: UserSchema,
      404: ErrorSchema,
    },
    "PUT /users/{id}": {
      summary: "Update user",
      tags: ["Users"],
      body: UpdateUserSchema,
      200: UserSchema,
      404: ErrorSchema,
    },
    "DELETE /users/{id}": {
      summary: "Delete user",
      tags: ["Users"],
      204: null,
      404: ErrorSchema,
    },
  },
});
```

## Common Patterns

### Optional Fields

Wrap the field schema in `v.optional()`:

```ts
const UpdateUserSchema = toStandardJsonSchema(
  v.object({
    name: v.optional(v.pipe(v.string(), v.minLength(1))),
    email: v.optional(v.pipe(v.string(), v.email())),
  }),
);
```

### Validations with `v.pipe()`

Valibot uses `v.pipe()` to chain validations. These are translated into JSON Schema constraints:

```ts
const schema = toStandardJsonSchema(
  v.object({
    email: v.pipe(v.string(), v.email()),
    age: v.pipe(v.number(), v.minValue(0), v.maxValue(150)),
    username: v.pipe(v.string(), v.minLength(3), v.maxLength(32)),
    id: v.pipe(v.string(), v.uuid()),
  }),
);
```

### Enums

Use `v.picklist()` for string enums:

```ts
const StatusSchema = toStandardJsonSchema(
  v.picklist(["active", "inactive", "suspended"]),
);
```

### Arrays

Use `v.array()` and wrap the result:

```ts
const TagListSchema = toStandardJsonSchema(v.array(v.string()));
```

### Wrapping Pattern

Remember: every schema passed to `openapi()` must go through `toStandardJsonSchema()`. A common pattern is to define a helper:

```ts
import * as v from "valibot";
import { toStandardJsonSchema } from "@valibot/to-json-schema";

const s = <T extends v.GenericSchema>(schema: T) =>
  toStandardJsonSchema(schema);

const UserSchema = s(
  v.object({
    id: v.pipe(v.string(), v.uuid()),
    name: v.string(),
  }),
);
```

## Related

- [Schemas & $ref](/guide/schemas) -- how schemas become `$ref` references
- [Schema Extensions](/guide/extending) -- adding OpenAPI-specific fields to schemas
- [Multi-Library Example](/examples/multi-library) -- the same API defined with Zod, ArkType, and Valibot
