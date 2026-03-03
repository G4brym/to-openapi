# Microservices Example

When your system is split across multiple services, each service can generate its own OpenAPI document independently. The `merge()` function combines them into a single unified spec for your API gateway, documentation portal, or client generator.

This example shows three microservices -- Users, Orders, and Products -- each defining their own routes and schemas, then merged into one gateway spec.

## Service Definitions

Each service defines its own OpenAPI document using `openapi()`. These services can live in separate packages, repositories, or deployment units.

### Users Service

```ts
// services/users/spec.ts
import { z } from "zod";
import { openapi } from "to-openapi";

const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(["admin", "member"]),
});

const CreateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["admin", "member"]).default("member"),
});

const ErrorSchema = z.object({
  message: z.string(),
  code: z.string(),
});

export const usersSpec = openapi({
  info: {
    title: "Users Service",
    version: "1.0.0",
  },
  tags: [
    { name: "Users", description: "User account management" },
  ],
  securitySchemes: {
    bearerAuth: {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
    },
  },
  schemas: {
    User: UserSchema,
    CreateUser: CreateUserSchema,
    UserError: ErrorSchema,
  },
  paths: {
    "GET /users": {
      summary: "List users",
      tags: ["Users"],
      operationId: "listUsers",
      200: UserSchema,
    },
    "POST /users": {
      summary: "Create user",
      tags: ["Users"],
      operationId: "createUser",
      body: CreateUserSchema,
      201: UserSchema,
      400: ErrorSchema,
    },
    "GET /users/{id}": {
      summary: "Get user by ID",
      tags: ["Users"],
      operationId: "getUser",
      200: UserSchema,
      404: ErrorSchema,
    },
    "DELETE /users/{id}": {
      summary: "Delete user",
      tags: ["Users"],
      operationId: "deleteUser",
      204: null,
      404: ErrorSchema,
    },
  },
});
```

### Orders Service

```ts
// services/orders/spec.ts
import { z } from "zod";
import { openapi } from "to-openapi";

const OrderItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
});

const OrderSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  items: z.array(OrderItemSchema),
  total: z.number(),
  status: z.enum(["pending", "confirmed", "shipped", "delivered", "cancelled"]),
  createdAt: z.string().datetime(),
});

const CreateOrderSchema = z.object({
  userId: z.string().uuid(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive(),
  })),
});

const OrderErrorSchema = z.object({
  message: z.string(),
  code: z.string(),
});

export const ordersSpec = openapi({
  info: {
    title: "Orders Service",
    version: "1.0.0",
  },
  tags: [
    { name: "Orders", description: "Order processing and management" },
  ],
  schemas: {
    Order: OrderSchema,
    OrderItem: OrderItemSchema,
    CreateOrder: CreateOrderSchema,
    OrderError: OrderErrorSchema,
  },
  paths: {
    "GET /orders": {
      summary: "List orders",
      tags: ["Orders"],
      operationId: "listOrders",
      query: z.object({
        userId: z.string().uuid().optional(),
        status: z.enum(["pending", "confirmed", "shipped", "delivered", "cancelled"]).optional(),
      }),
      200: OrderSchema,
    },
    "POST /orders": {
      summary: "Create order",
      tags: ["Orders"],
      operationId: "createOrder",
      body: CreateOrderSchema,
      201: OrderSchema,
      400: OrderErrorSchema,
    },
    "GET /orders/{id}": {
      summary: "Get order by ID",
      tags: ["Orders"],
      operationId: "getOrder",
      200: OrderSchema,
      404: OrderErrorSchema,
    },
    "PUT /orders/{id}/cancel": {
      summary: "Cancel order",
      tags: ["Orders"],
      operationId: "cancelOrder",
      200: OrderSchema,
      404: OrderErrorSchema,
    },
  },
});
```

### Products Service

```ts
// services/products/spec.ts
import { z } from "zod";
import { openapi } from "to-openapi";

const ProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  price: z.number().positive(),
  category: z.string(),
  inStock: z.boolean(),
});

const CreateProductSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  price: z.number().positive(),
  category: z.string(),
});

const UpdateProductSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  category: z.string().optional(),
  inStock: z.boolean().optional(),
});

const ProductErrorSchema = z.object({
  message: z.string(),
  code: z.string(),
});

export const productsSpec = openapi({
  info: {
    title: "Products Service",
    version: "1.0.0",
  },
  tags: [
    { name: "Products", description: "Product catalog management" },
  ],
  schemas: {
    Product: ProductSchema,
    CreateProduct: CreateProductSchema,
    UpdateProduct: UpdateProductSchema,
    ProductError: ProductErrorSchema,
  },
  paths: {
    "GET /products": {
      summary: "List products",
      tags: ["Products"],
      operationId: "listProducts",
      query: z.object({
        category: z.string().optional(),
        inStock: z.boolean().optional(),
      }),
      200: ProductSchema,
    },
    "POST /products": {
      summary: "Create product",
      tags: ["Products"],
      operationId: "createProduct",
      body: CreateProductSchema,
      201: ProductSchema,
      400: ProductErrorSchema,
    },
    "GET /products/{id}": {
      summary: "Get product by ID",
      tags: ["Products"],
      operationId: "getProduct",
      200: ProductSchema,
      404: ProductErrorSchema,
    },
    "PUT /products/{id}": {
      summary: "Update product",
      tags: ["Products"],
      operationId: "updateProduct",
      body: UpdateProductSchema,
      200: ProductSchema,
      404: ProductErrorSchema,
    },
    "DELETE /products/{id}": {
      summary: "Delete product",
      tags: ["Products"],
      operationId: "deleteProduct",
      204: null,
      404: ProductErrorSchema,
    },
  },
});
```

## Merging at the Gateway

The gateway imports every service's spec and merges them into a single document using `merge()`. The first argument is the base document that provides the top-level `info`, `servers`, and `security` fields. All subsequent arguments contribute their paths, schemas, tags, and security schemes.

```ts
// gateway/spec.ts
import { openapi, merge } from "to-openapi";
import { usersSpec } from "../services/users/spec.js";
import { ordersSpec } from "../services/orders/spec.js";
import { productsSpec } from "../services/products/spec.js";

// The base document defines gateway-level metadata
const gatewayBase = openapi({
  info: {
    title: "E-Commerce Gateway API",
    version: "2.0.0",
    description: "Unified API gateway for the e-commerce platform",
    contact: {
      name: "Platform Team",
      email: "platform@example.com",
    },
  },
  servers: [
    { url: "https://api.example.com", description: "Production" },
    { url: "https://staging-api.example.com", description: "Staging" },
  ],
  security: [{ bearerAuth: [] }],
  paths: {},
});

// Merge all service specs into one
const gatewaySpec = merge(gatewayBase, usersSpec, ordersSpec, productsSpec);

// Serve or export the merged spec
console.log(JSON.stringify(gatewaySpec, null, 2));
```

## What `merge()` Combines

The `merge()` function unifies the following sections from every source document into the base:

- **Paths** -- All path items and their operations are collected. If two services define different HTTP methods on the same path (e.g., one defines `GET /items` and another defines `POST /items`), they are combined into a single path item. If two services define the same method on the same path, `merge()` throws a `DUPLICATE_PATH` error.

- **Component schemas** -- All entries from `components.schemas` are collected. Duplicate schema names across services cause a `DUPLICATE_SCHEMA` error, so use distinct prefixes (e.g., `UserError`, `OrderError`, `ProductError`) when multiple services define similar schemas.

- **Security schemes** -- All entries from `components.securitySchemes` are combined. In the example above, the `bearerAuth` scheme defined by the Users service becomes available to all routes in the merged document.

- **Tags** -- Tags are deduplicated by name. Each tag appears once in the merged output, preserving the description from the first service that defined it.

- **Servers and security** -- The base document's `servers` and `security` arrays take priority. If the base does not define them, the first source that provides them is used.

## Resulting Structure

After merging, the gateway spec contains every route and schema from all three services under a single `info` block:

```json
{
  "openapi": "3.1.0",
  "info": {
    "title": "E-Commerce Gateway API",
    "version": "2.0.0",
    "description": "Unified API gateway for the e-commerce platform"
  },
  "servers": [
    { "url": "https://api.example.com", "description": "Production" },
    { "url": "https://staging-api.example.com", "description": "Staging" }
  ],
  "security": [{ "bearerAuth": [] }],
  "tags": [
    { "name": "Users", "description": "User account management" },
    { "name": "Orders", "description": "Order processing and management" },
    { "name": "Products", "description": "Product catalog management" }
  ],
  "paths": {
    "/users": { "get": { "..." : "..." }, "post": { "..." : "..." } },
    "/users/{id}": { "get": { "..." : "..." }, "delete": { "..." : "..." } },
    "/orders": { "get": { "..." : "..." }, "post": { "..." : "..." } },
    "/orders/{id}": { "get": { "..." : "..." } },
    "/orders/{id}/cancel": { "put": { "..." : "..." } },
    "/products": { "get": { "..." : "..." }, "post": { "..." : "..." } },
    "/products/{id}": { "get": { "..." : "..." }, "put": { "..." : "..." }, "delete": { "..." : "..." } }
  },
  "components": {
    "schemas": {
      "User": { "..." : "..." },
      "CreateUser": { "..." : "..." },
      "UserError": { "..." : "..." },
      "Order": { "..." : "..." },
      "OrderItem": { "..." : "..." },
      "CreateOrder": { "..." : "..." },
      "OrderError": { "..." : "..." },
      "Product": { "..." : "..." },
      "CreateProduct": { "..." : "..." },
      "UpdateProduct": { "..." : "..." },
      "ProductError": { "..." : "..." }
    },
    "securitySchemes": {
      "bearerAuth": {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT"
      }
    }
  }
}
```

## Tips for Microservice Merging

- **Use unique schema names.** If two services both register a schema called `Error`, `merge()` throws a `DUPLICATE_SCHEMA` error. Prefix schema names with the service name (e.g., `UserError`, `OrderError`) to avoid collisions.

- **Avoid duplicate operations.** Two services cannot define the same method + path combination. Design your path structure so each service owns a distinct URL prefix.

- **Let the gateway own metadata.** Define `info`, `servers`, `security`, and global configuration in the base document. Individual service specs can omit these fields since the gateway's values take precedence.

- **Merge at build time or at startup.** The `merge()` call is cheap. You can run it in a build step to produce a static JSON file, or call it once at server startup to serve the spec dynamically.
