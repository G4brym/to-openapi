import { describe, expectTypeOf, it } from "vitest";
import type { ApiKeyAuthOptions } from "../../src/plugins/api-key-auth";
import { apiKeyAuth } from "../../src/plugins/api-key-auth";
import type { AutoTagsOptions } from "../../src/plugins/auto-tags";
import { autoTags } from "../../src/plugins/auto-tags";
import type { BearerAuthOptions } from "../../src/plugins/bearer-auth";
import { bearerAuth } from "../../src/plugins/bearer-auth";
import type { ErrorResponseEntry } from "../../src/plugins/error-responses";
import { errorResponses } from "../../src/plugins/error-responses";
import type {
	OpenAPIDocument,
	RouteDefinition,
	SchemaContext,
	SchemaOrRef,
	ToOpenapiPlugin,
} from "../../src/types";

describe("plugin types", () => {
	describe("ToOpenapiPlugin", () => {
		it("requires name", () => {
			expectTypeOf<{ name: string }>().toMatchTypeOf<ToOpenapiPlugin>();
		});

		it("rejects missing name", () => {
			expectTypeOf<{}>().not.toMatchTypeOf<ToOpenapiPlugin>();
		});

		it("transformRoute accepts RouteDefinition and returns RouteDefinition", () => {
			expectTypeOf<{
				name: string;
				transformRoute: (route: RouteDefinition) => RouteDefinition;
			}>().toMatchTypeOf<ToOpenapiPlugin>();
		});

		it("transformSchema accepts SchemaOrRef and SchemaContext, returns SchemaOrRef", () => {
			expectTypeOf<{
				name: string;
				transformSchema: (schema: SchemaOrRef, context: SchemaContext) => SchemaOrRef;
			}>().toMatchTypeOf<ToOpenapiPlugin>();
		});

		it("transformDocument accepts OpenAPIDocument and returns OpenAPIDocument", () => {
			expectTypeOf<{
				name: string;
				transformDocument: (doc: OpenAPIDocument) => OpenAPIDocument;
			}>().toMatchTypeOf<ToOpenapiPlugin>();
		});
	});

	describe("bearerAuth", () => {
		it("returns ToOpenapiPlugin", () => {
			expectTypeOf(bearerAuth).returns.toMatchTypeOf<ToOpenapiPlugin>();
		});

		it("BearerAuthOptions has all optional fields", () => {
			expectTypeOf<{}>().toMatchTypeOf<BearerAuthOptions>();
		});

		it("BearerAuthOptions accepts full object", () => {
			expectTypeOf<{
				schemeName: string;
				bearerFormat: string;
				description: string;
				exclude: string[];
			}>().toMatchTypeOf<BearerAuthOptions>();
		});
	});

	describe("apiKeyAuth", () => {
		it("returns ToOpenapiPlugin", () => {
			expectTypeOf(apiKeyAuth).returns.toMatchTypeOf<ToOpenapiPlugin>();
		});

		it("ApiKeyAuthOptions requires name and in", () => {
			expectTypeOf<{
				name: string;
				in: "header";
			}>().toMatchTypeOf<ApiKeyAuthOptions>();
		});

		it("ApiKeyAuthOptions rejects missing name", () => {
			expectTypeOf<{ in: "header" }>().not.toMatchTypeOf<ApiKeyAuthOptions>();
		});

		it("ApiKeyAuthOptions rejects missing in", () => {
			expectTypeOf<{ name: string }>().not.toMatchTypeOf<ApiKeyAuthOptions>();
		});

		it("ApiKeyAuthOptions accepts each valid in value", () => {
			expectTypeOf<{ name: string; in: "header" }>().toMatchTypeOf<ApiKeyAuthOptions>();
			expectTypeOf<{ name: string; in: "query" }>().toMatchTypeOf<ApiKeyAuthOptions>();
			expectTypeOf<{ name: string; in: "cookie" }>().toMatchTypeOf<ApiKeyAuthOptions>();
		});
	});

	describe("autoTags", () => {
		it("returns ToOpenapiPlugin", () => {
			expectTypeOf(autoTags).returns.toMatchTypeOf<ToOpenapiPlugin>();
		});

		it("AutoTagsOptions has all optional fields", () => {
			expectTypeOf<{}>().toMatchTypeOf<AutoTagsOptions>();
		});

		it("AutoTagsOptions accepts prefix", () => {
			expectTypeOf<{ prefix: string }>().toMatchTypeOf<AutoTagsOptions>();
		});
	});

	describe("errorResponses", () => {
		it("returns ToOpenapiPlugin", () => {
			expectTypeOf(errorResponses).returns.toMatchTypeOf<ToOpenapiPlugin>();
		});

		it("ErrorResponseEntry requires status", () => {
			expectTypeOf<{ status: number }>().toMatchTypeOf<ErrorResponseEntry>();
		});

		it("ErrorResponseEntry rejects missing status", () => {
			expectTypeOf<{ description: string }>().not.toMatchTypeOf<ErrorResponseEntry>();
		});

		it("ErrorResponseEntry accepts full object", () => {
			expectTypeOf<{
				status: number;
				schema: import("@standard-schema/spec").StandardJSONSchemaV1;
				description: string;
			}>().toMatchTypeOf<ErrorResponseEntry>();
		});
	});
});
