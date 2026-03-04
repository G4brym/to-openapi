import type { StandardJSONSchemaV1 } from "@standard-schema/spec";
import { describe, expectTypeOf, it } from "vitest";
import { extend } from "../../src/extend";
import { merge } from "../../src/merge";
import { OpenAPI } from "../../src/openapi-class";
import { openapi } from "../../src/openapi-fn";
import type {
	HttpMethod,
	OpenAPIDocument,
	OpenAPIOptions,
	RouteShorthand,
	ToOpenapiDefinition,
	ToOpenapiPlugin,
} from "../../src/types";

describe("type-level inference", () => {
	it("openapi() returns OpenAPIDocument", () => {
		expectTypeOf(openapi).returns.toEqualTypeOf<OpenAPIDocument>();
	});

	it("OpenAPI.document() returns OpenAPIDocument", () => {
		expectTypeOf<OpenAPI["document"]>().returns.toEqualTypeOf<OpenAPIDocument>();
	});

	it("merge returns OpenAPIDocument", () => {
		expectTypeOf(merge).returns.toEqualTypeOf<OpenAPIDocument>();
	});

	it("extend returns StandardJSONSchemaV1", () => {
		expectTypeOf(extend).returns.toEqualTypeOf<StandardJSONSchemaV1>();
	});

	it("ToOpenapiDefinition accepts valid definition", () => {
		expectTypeOf<{
			info: { title: string; version: string };
			paths: Record<string, RouteShorthand>;
		}>().toMatchTypeOf<ToOpenapiDefinition>();
	});

	it("HttpMethod is a union of 8 methods", () => {
		expectTypeOf<"get">().toMatchTypeOf<HttpMethod>();
		expectTypeOf<"post">().toMatchTypeOf<HttpMethod>();
		expectTypeOf<"put">().toMatchTypeOf<HttpMethod>();
		expectTypeOf<"patch">().toMatchTypeOf<HttpMethod>();
		expectTypeOf<"delete">().toMatchTypeOf<HttpMethod>();
		expectTypeOf<"head">().toMatchTypeOf<HttpMethod>();
		expectTypeOf<"options">().toMatchTypeOf<HttpMethod>();
		expectTypeOf<"trace">().toMatchTypeOf<HttpMethod>();
	});

	it("ToOpenapiPlugin has correct shape", () => {
		expectTypeOf<{ name: string }>().toMatchTypeOf<ToOpenapiPlugin>();
	});

	it("OpenAPI class methods return this for chaining", () => {
		const api = new OpenAPI({ info: { title: "T", version: "1" } });
		expectTypeOf(api.schema("n", {} as StandardJSONSchemaV1)).toEqualTypeOf<typeof api>();
		expectTypeOf(api.route("get", "/", {})).toEqualTypeOf<typeof api>();
	});

	it("OpenAPI.webhook() returns this for chaining", () => {
		const api = new OpenAPI({ info: { title: "T", version: "1" } });
		expectTypeOf(api.webhook("post", "orderCreated", {})).toEqualTypeOf<typeof api>();
	});

	it("ToOpenapiDefinition accepts full definition with all fields", () => {
		expectTypeOf<{
			info: { title: string; version: string };
			paths: Record<string, RouteShorthand>;
			webhooks: Record<string, RouteShorthand>;
			schemas: Record<string, StandardJSONSchemaV1>;
			plugins: ToOpenapiPlugin[];
			openapi: "3.1.0";
			servers: [{ url: string }];
			security: [{ bearerAuth: [] }];
			securitySchemes: Record<string, { type: "http" }>;
			tags: [{ name: string }];
			externalDocs: { url: string };
		}>().toMatchTypeOf<ToOpenapiDefinition>();
	});

	it("OpenAPIOptions accepts valid options", () => {
		expectTypeOf<{
			info: { title: string; version: string };
			openapi: "3.0.3";
			servers: [{ url: string }];
			plugins: ToOpenapiPlugin[];
		}>().toMatchTypeOf<OpenAPIOptions>();
	});
});
