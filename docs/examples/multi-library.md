# Multi-Library Example

to-openapi works with any schema library that implements the [Standard Schema](https://github.com/standard-schema/standard-schema) specification. This means you can use Zod, ArkType, Valibot, or any other conforming library without changing how you call to-openapi.

This example shows the same User CRUD API defined three different ways. The `openapi()` call is identical in every case -- only the schema definitions change.

## With Zod

```ts
import { z } from "zod";
import { openapi } from "to-openapi";

const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  createdAt: z.string().datetime(),
});

const CreateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

const UpdateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
});

const ErrorSchema = z.object({
  message: z.string(),
  code: z.string(),
});

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

## With ArkType

```ts
import { type } from "arktype";
import { openapi } from "to-openapi";

const UserSchema = type({
  id: "string",
  name: "string",
  email: "string",
  createdAt: "string",
});

const CreateUserSchema = type({
  name: "string",
  email: "string",
});

const UpdateUserSchema = type({
  "name?": "string",
  "email?": "string",
});

const ErrorSchema = type({
  message: "string",
  code: "string",
});

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

## With Valibot

```ts
import * as v from "valibot";
import { openapi } from "to-openapi";

const UserSchema = v.object({
  id: v.pipe(v.string(), v.uuid()),
  name: v.pipe(v.string(), v.minLength(1)),
  email: v.pipe(v.string(), v.email()),
  createdAt: v.pipe(v.string(), v.isoTimestamp()),
});

const CreateUserSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1)),
  email: v.pipe(v.string(), v.email()),
});

const UpdateUserSchema = v.object({
  name: v.optional(v.pipe(v.string(), v.minLength(1))),
  email: v.optional(v.pipe(v.string(), v.email())),
});

const ErrorSchema = v.object({
  message: v.string(),
  code: v.string(),
});

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

## Why This Works

All three examples produce the same OpenAPI document structure. to-openapi never imports or depends on Zod, ArkType, or Valibot directly. Instead, it reads schemas through the [Standard Schema](https://github.com/standard-schema/standard-schema) interface -- a vendor-neutral protocol that all three libraries implement.

Each schema library exposes a `~standard` property containing a `jsonSchema` field. to-openapi reads that JSON Schema representation and converts it into OpenAPI-compatible schema objects. The library you choose is purely a matter of preference.

This also means you can mix libraries within the same project. If one team prefers Zod and another prefers ArkType, both can define schemas independently and pass them to the same `openapi()` call.

```ts
import { z } from "zod";
import { type } from "arktype";
import { openapi } from "to-openapi";

// Zod schema for one resource
const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
});

// ArkType schema for another resource
const CategorySchema = type({
  id: "string",
  label: "string",
});

const spec = openapi({
  info: { title: "Catalog API", version: "1.0.0" },
  paths: {
    "GET /products": {
      summary: "List products",
      200: ProductSchema,
    },
    "GET /categories": {
      summary: "List categories",
      200: CategorySchema,
    },
  },
});
```

to-openapi treats every schema the same way, regardless of which library created it.
