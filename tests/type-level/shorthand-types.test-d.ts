import type { StandardJSONSchemaV1 } from "@standard-schema/spec";
import { describe, expectTypeOf, it } from "vitest";
import type {
	BodyShorthandObject,
	HttpMethod,
	ParsedRoute,
	RequestBodyObject,
	ResponseObject,
	ResponseShorthandObject,
	RouteDefinition,
	RouteShorthand,
	SchemaContext,
} from "../../src/types";

describe("shorthand types", () => {
	describe("ResponseShorthandObject", () => {
		it("accepts empty object (all optional)", () => {
			expectTypeOf<{}>().toMatchTypeOf<ResponseShorthandObject>();
		});

		it("accepts schema as StandardJSONSchemaV1", () => {
			expectTypeOf<{
				schema: StandardJSONSchemaV1;
			}>().toMatchTypeOf<ResponseShorthandObject>();
		});

		it("accepts schema as string reference", () => {
			expectTypeOf<{ schema: string }>().toMatchTypeOf<ResponseShorthandObject>();
		});

		it("accepts full object", () => {
			expectTypeOf<{
				schema: StandardJSONSchemaV1;
				contentType: string;
				description: string;
				headers: Record<string, { description: string }>;
				example: unknown;
				examples: Record<string, { summary: string }>;
			}>().toMatchTypeOf<ResponseShorthandObject>();
		});
	});

	describe("BodyShorthandObject", () => {
		it("accepts empty object (all optional)", () => {
			expectTypeOf<{}>().toMatchTypeOf<BodyShorthandObject>();
		});

		it("accepts schema as StandardJSONSchemaV1", () => {
			expectTypeOf<{
				schema: StandardJSONSchemaV1;
			}>().toMatchTypeOf<BodyShorthandObject>();
		});

		it("accepts full object", () => {
			expectTypeOf<{
				schema: StandardJSONSchemaV1;
				contentType: string;
				description: string;
				required: boolean;
				example: unknown;
				examples: Record<string, { summary: string }>;
			}>().toMatchTypeOf<BodyShorthandObject>();
		});
	});

	describe("RouteShorthand", () => {
		it("accepts empty object", () => {
			expectTypeOf<{}>().toMatchTypeOf<RouteShorthand>();
		});

		it("accepts named fields", () => {
			expectTypeOf<{
				query: StandardJSONSchemaV1;
				params: StandardJSONSchemaV1;
				headers: StandardJSONSchemaV1;
				cookies: StandardJSONSchemaV1;
				summary: string;
				description: string;
				operationId: string;
				tags: string[];
				deprecated: boolean;
				security: [{ bearerAuth: [] }];
			}>().toMatchTypeOf<RouteShorthand>();
		});

		it("accepts body as StandardJSONSchemaV1", () => {
			expectTypeOf<{ body: StandardJSONSchemaV1 }>().toMatchTypeOf<RouteShorthand>();
		});

		it("accepts body as RequestBodyObject", () => {
			expectTypeOf<{ body: RequestBodyObject }>().toMatchTypeOf<RouteShorthand>();
		});

		it("accepts body as BodyShorthandObject", () => {
			expectTypeOf<{ body: BodyShorthandObject }>().toMatchTypeOf<RouteShorthand>();
		});

		it("accepts vendor extensions", () => {
			expectTypeOf<{ "x-custom": string }>().toMatchTypeOf<RouteShorthand>();
		});
	});

	describe("RouteDefinition", () => {
		it("requires method and path", () => {
			expectTypeOf<{
				method: "get";
				path: string;
			}>().toMatchTypeOf<RouteDefinition>();
		});

		it("rejects missing method", () => {
			expectTypeOf<{ path: string }>().not.toMatchTypeOf<RouteDefinition>();
		});

		it("rejects missing path", () => {
			expectTypeOf<{ method: "get" }>().not.toMatchTypeOf<RouteDefinition>();
		});

		it("extends RouteShorthand", () => {
			expectTypeOf<RouteDefinition>().toMatchTypeOf<RouteShorthand>();
		});
	});

	describe("ParsedRoute", () => {
		it("accepts valid object", () => {
			expectTypeOf<{
				method: HttpMethod;
				path: string;
				pathParams: string[];
			}>().toMatchTypeOf<ParsedRoute>();
		});

		it("rejects missing method", () => {
			expectTypeOf<{
				path: string;
				pathParams: string[];
			}>().not.toMatchTypeOf<ParsedRoute>();
		});

		it("rejects missing path", () => {
			expectTypeOf<{
				method: HttpMethod;
				pathParams: string[];
			}>().not.toMatchTypeOf<ParsedRoute>();
		});

		it("rejects missing pathParams", () => {
			expectTypeOf<{
				method: HttpMethod;
				path: string;
			}>().not.toMatchTypeOf<ParsedRoute>();
		});
	});

	describe("SchemaContext", () => {
		it("accepts each valid location", () => {
			expectTypeOf<{ location: "body" }>().toMatchTypeOf<SchemaContext>();
			expectTypeOf<{ location: "query" }>().toMatchTypeOf<SchemaContext>();
			expectTypeOf<{ location: "path" }>().toMatchTypeOf<SchemaContext>();
			expectTypeOf<{ location: "header" }>().toMatchTypeOf<SchemaContext>();
			expectTypeOf<{ location: "response" }>().toMatchTypeOf<SchemaContext>();
			expectTypeOf<{ location: "component" }>().toMatchTypeOf<SchemaContext>();
		});

		it("accepts optional name", () => {
			expectTypeOf<{ location: "body"; name: string }>().toMatchTypeOf<SchemaContext>();
		});

		it("rejects missing location", () => {
			expectTypeOf<{ name: string }>().not.toMatchTypeOf<SchemaContext>();
		});
	});
});
