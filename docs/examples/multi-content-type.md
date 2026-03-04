# Multi-Content-Type Example

Build a Report Export API where reports can be retrieved as JSON or downloaded as CSV/PDF. This example demonstrates using multiple content types on a single response, a common pattern for content negotiation.

## Define Your Schemas

First, define schemas using any Standard Schema-compatible library. The examples below use placeholder variables -- replace them with your Zod, ArkType, Valibot, or other Standard Schema objects.

```ts
// Your Zod/ArkType/Valibot schemas -- any Standard Schema-compatible library works
const ReportSchema = /* your schema here */;
const CreateReportSchema = /* your schema here */;  // e.g. { title, startDate, endDate }
const ErrorSchema = /* your schema here */;
```

## Generate the OpenAPI Spec

Use the `openapi()` function to declare routes with multi-content-type responses. The key is using a full `ResponseObject` for status codes that need multiple content types.

```ts
import { openapi } from "to-openapi";

const spec = openapi({
  info: {
    title: "Report Export API",
    version: "1.0.0",
    description: "An API for generating and exporting reports",
  },
  servers: [
    { url: "https://api.example.com/v1", description: "Production" },
  ],
  tags: [
    { name: "Reports", description: "Report generation and export" },
  ],

  schemas: {
    Report: ReportSchema,
    Error: ErrorSchema,
  },

  paths: {
    // Create a new report
    "POST /reports": {
      summary: "Create a report",
      description: "Generate a new report from the provided parameters.",
      tags: ["Reports"],
      operationId: "createReport",
      body: CreateReportSchema,
      201: ReportSchema,
      400: ErrorSchema,
    },

    // Get a report as JSON or CSV
    "GET /reports/{id}": {
      summary: "Get a report",
      description: "Retrieve a report as JSON or download as CSV.",
      tags: ["Reports"],
      operationId: "getReport",
      200: {
        description: "The requested report",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Report" },
          },
          "text/csv": {
            schema: { type: "string" },
          },
        },
      },
      404: ErrorSchema,
    },

    // Export a report as JSON or PDF
    "GET /reports/{id}/export": {
      summary: "Export a report",
      description: "Export a report as JSON data or a PDF document.",
      tags: ["Reports"],
      operationId: "exportReport",
      200: {
        description: "The exported report",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Report" },
          },
          "application/pdf": {
            schema: { type: "string", format: "binary" },
          },
        },
      },
      404: ErrorSchema,
    },
  },
});
```

Key details:

- **ResponseObject passthrough** — when a status code value has a `description` or `content` property (and no `~standard` property), it is passed through to the OpenAPI output as-is.
- **Multiple content types** — list each media type under `content` with its own schema. Use `{ type: "string" }` for text formats like CSV, and `{ type: "string", format: "binary" }` for binary formats like PDF.
- **`$ref` usage** — reference named schemas registered via the `schemas` option. To appear in `components/schemas`, a schema must also be used through the shorthand system on at least one route (e.g., `201: ReportSchema` on `POST /reports`).

## Generated Output

The resulting `spec` is a fully valid OpenAPI 3.1.0 document. Here is an abbreviated look at the multi-content-type response structure:

```json
{
  "openapi": "3.1.0",
  "info": {
    "title": "Report Export API",
    "version": "1.0.0",
    "description": "An API for generating and exporting reports"
  },
  "paths": {
    "/reports": {
      "post": {
        "operationId": "createReport",
        "summary": "Create a report",
        "tags": ["Reports"],
        "requestBody": {
          "content": {
            "application/json": { "schema": { "..." : "..." } }
          }
        },
        "responses": {
          "201": {
            "description": "Resource created",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/Report" }
              }
            }
          }
        }
      }
    },
    "/reports/{id}": {
      "get": {
        "operationId": "getReport",
        "summary": "Get a report",
        "tags": ["Reports"],
        "parameters": [
          { "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }
        ],
        "responses": {
          "200": {
            "description": "The requested report",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/Report" }
              },
              "text/csv": {
                "schema": { "type": "string" }
              }
            }
          },
          "404": {
            "description": "Not found",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/Error" }
              }
            }
          }
        }
      }
    },
    "/reports/{id}/export": {
      "get": {
        "operationId": "exportReport",
        "summary": "Export a report",
        "tags": ["Reports"],
        "parameters": [
          { "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }
        ],
        "responses": {
          "200": {
            "description": "The exported report",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/Report" }
              },
              "application/pdf": {
                "schema": { "type": "string", "format": "binary" }
              }
            }
          }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "Report": { "..." : "..." },
      "Error": { "..." : "..." }
    }
  }
}
```

## Using the Class API

The same spec can be built incrementally with the `OpenAPI` class.

```ts
import { OpenAPI } from "to-openapi";

const api = new OpenAPI({
  info: {
    title: "Report Export API",
    version: "1.0.0",
    description: "An API for generating and exporting reports",
  },
  servers: [
    { url: "https://api.example.com/v1", description: "Production" },
  ],
  tags: [
    { name: "Reports", description: "Report generation and export" },
  ],
});

api.schema("Report", ReportSchema);
api.schema("Error", ErrorSchema);

api.route("post", "/reports", {
  summary: "Create a report",
  tags: ["Reports"],
  operationId: "createReport",
  body: CreateReportSchema,
  201: ReportSchema,
  400: ErrorSchema,
});

api.route("get", "/reports/{id}", {
  summary: "Get a report",
  tags: ["Reports"],
  operationId: "getReport",
  200: {
    description: "The requested report",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/Report" },
      },
      "text/csv": {
        schema: { type: "string" },
      },
    },
  },
  404: ErrorSchema,
});

api.route("get", "/reports/{id}/export", {
  summary: "Export a report",
  tags: ["Reports"],
  operationId: "exportReport",
  200: {
    description: "The exported report",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/Report" },
      },
      "application/pdf": {
        schema: { type: "string", format: "binary" },
      },
    },
  },
  404: ErrorSchema,
});

const spec = api.document();
```

Both approaches produce identical output. Use whichever style fits your project.
