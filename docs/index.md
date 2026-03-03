---
layout: home

hero:
  name: to-openapi
  text: OpenAPI from any schema
  tagline: Generate OpenAPI 3.1 specs from Zod, ArkType, Valibot, and any Standard Schema library.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: Why to-openapi?
      link: /guide/why
    - theme: alt
      text: API Reference
      link: /api/openapi-function

features:
  - title: Schema Agnostic
    details: Works with any library implementing the Standard Schema interface — Zod, ArkType, Valibot, and more. No lock-in.
  - title: Two APIs
    details: Use the declarative openapi() function for simple specs, or the chainable OpenAPI class builder for dynamic construction.
  - title: Plugin System
    details: Transform routes, schemas, and entire documents with composable plugins. Ships with bearer auth, auto tags, and error responses.
  - title: Spec Merging
    details: Combine multiple OpenAPI documents with merge() — perfect for microservices and modular architectures.
  - title: Automatic $ref
    details: Schemas are automatically deduplicated and promoted to components/schemas with $ref references.
  - title: Type Safe
    details: Full TypeScript support with exported types for routes, plugins, schemas, and every OpenAPI construct.
---
