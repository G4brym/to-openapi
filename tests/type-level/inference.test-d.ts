import type { StandardJSONSchemaV1 } from "@standard-schema/spec";
import { describe, expectTypeOf, it } from "vitest";
import { extend } from "../../src/extend";
import { merge } from "../../src/merge";
import { OpenAPI } from "../../src/openapi-class";
import { openapi } from "../../src/openapi-fn";
import type {
	HttpMethod,
	OpenAPIDocument,
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
});
