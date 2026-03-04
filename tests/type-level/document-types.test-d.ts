import { describe, expectTypeOf, it } from "vitest";
import type {
	ComponentsObject,
	ExampleObject,
	ExternalDocsObject,
	HeaderObject,
	InfoObject,
	MediaTypeObject,
	OpenAPIDocument,
	OperationObject,
	ParameterObject,
	PathItemObject,
	ReferenceObject,
	RequestBodyObject,
	ResponseObject,
	SchemaOrRef,
	SecurityRequirementObject,
	SecuritySchemeObject,
	ServerObject,
	TagObject,
} from "../../src/types";

describe("document types", () => {
	describe("ReferenceObject", () => {
		it("accepts valid $ref", () => {
			expectTypeOf<{ $ref: string }>().toMatchTypeOf<ReferenceObject>();
		});

		it("rejects missing $ref", () => {
			expectTypeOf<{}>().not.toMatchTypeOf<ReferenceObject>();
		});
	});

	describe("SchemaOrRef", () => {
		it("accepts a plain record", () => {
			expectTypeOf<Record<string, unknown>>().toMatchTypeOf<SchemaOrRef>();
		});

		it("accepts a ReferenceObject", () => {
			expectTypeOf<ReferenceObject>().toMatchTypeOf<SchemaOrRef>();
		});
	});

	describe("InfoObject", () => {
		it("accepts minimal valid object", () => {
			expectTypeOf<{ title: string; version: string }>().toMatchTypeOf<InfoObject>();
		});

		it("accepts full object", () => {
			expectTypeOf<{
				title: string;
				version: string;
				description: string;
				termsOfService: string;
				contact: { name: string; url: string; email: string };
				license: { name: string; url: string };
			}>().toMatchTypeOf<InfoObject>();
		});

		it("rejects missing title", () => {
			expectTypeOf<{ version: string }>().not.toMatchTypeOf<InfoObject>();
		});

		it("rejects missing version", () => {
			expectTypeOf<{ title: string }>().not.toMatchTypeOf<InfoObject>();
		});
	});

	describe("ServerObject", () => {
		it("accepts minimal valid object", () => {
			expectTypeOf<{ url: string }>().toMatchTypeOf<ServerObject>();
		});

		it("accepts full object", () => {
			expectTypeOf<{
				url: string;
				description: string;
				variables: Record<string, { default: string; enum: string[]; description: string }>;
			}>().toMatchTypeOf<ServerObject>();
		});

		it("rejects missing url", () => {
			expectTypeOf<{ description: string }>().not.toMatchTypeOf<ServerObject>();
		});
	});

	describe("ExternalDocsObject", () => {
		it("accepts minimal valid object", () => {
			expectTypeOf<{ url: string }>().toMatchTypeOf<ExternalDocsObject>();
		});

		it("accepts full object", () => {
			expectTypeOf<{ url: string; description: string }>().toMatchTypeOf<ExternalDocsObject>();
		});

		it("rejects missing url", () => {
			expectTypeOf<{ description: string }>().not.toMatchTypeOf<ExternalDocsObject>();
		});
	});

	describe("TagObject", () => {
		it("accepts minimal valid object", () => {
			expectTypeOf<{ name: string }>().toMatchTypeOf<TagObject>();
		});

		it("accepts full object", () => {
			expectTypeOf<{
				name: string;
				description: string;
				externalDocs: ExternalDocsObject;
			}>().toMatchTypeOf<TagObject>();
		});

		it("rejects missing name", () => {
			expectTypeOf<{ description: string }>().not.toMatchTypeOf<TagObject>();
		});
	});

	describe("SecurityRequirementObject", () => {
		it("accepts index signature with string array values", () => {
			expectTypeOf<{ bearerAuth: string[] }>().toMatchTypeOf<SecurityRequirementObject>();
		});
	});

	describe("SecuritySchemeObject", () => {
		it("accepts each valid type", () => {
			expectTypeOf<{ type: "apiKey" }>().toMatchTypeOf<SecuritySchemeObject>();
			expectTypeOf<{ type: "http" }>().toMatchTypeOf<SecuritySchemeObject>();
			expectTypeOf<{ type: "oauth2" }>().toMatchTypeOf<SecuritySchemeObject>();
			expectTypeOf<{ type: "openIdConnect" }>().toMatchTypeOf<SecuritySchemeObject>();
		});

		it("accepts full object", () => {
			expectTypeOf<{
				type: "http";
				description: string;
				scheme: string;
				bearerFormat: string;
			}>().toMatchTypeOf<SecuritySchemeObject>();
		});

		it("rejects missing type", () => {
			expectTypeOf<{ description: string }>().not.toMatchTypeOf<SecuritySchemeObject>();
		});
	});

	describe("MediaTypeObject", () => {
		it("accepts empty object (all optional)", () => {
			expectTypeOf<{}>().toMatchTypeOf<MediaTypeObject>();
		});

		it("accepts full object", () => {
			expectTypeOf<{
				schema: SchemaOrRef;
				example: unknown;
				examples: Record<string, unknown>;
				encoding: Record<string, unknown>;
			}>().toMatchTypeOf<MediaTypeObject>();
		});
	});

	describe("ParameterObject", () => {
		it("accepts minimal valid object", () => {
			expectTypeOf<{ name: string; in: "query" }>().toMatchTypeOf<ParameterObject>();
		});

		it("accepts each valid in value", () => {
			expectTypeOf<{ name: string; in: "header" }>().toMatchTypeOf<ParameterObject>();
			expectTypeOf<{ name: string; in: "path" }>().toMatchTypeOf<ParameterObject>();
			expectTypeOf<{ name: string; in: "cookie" }>().toMatchTypeOf<ParameterObject>();
		});

		it("accepts full object", () => {
			expectTypeOf<{
				name: string;
				in: "query";
				description: string;
				required: boolean;
				deprecated: boolean;
				schema: SchemaOrRef;
				style: string;
				explode: boolean;
			}>().toMatchTypeOf<ParameterObject>();
		});

		it("rejects missing name", () => {
			expectTypeOf<{ in: "query" }>().not.toMatchTypeOf<ParameterObject>();
		});

		it("rejects missing in", () => {
			expectTypeOf<{ name: string }>().not.toMatchTypeOf<ParameterObject>();
		});
	});

	describe("RequestBodyObject", () => {
		it("accepts minimal valid object", () => {
			expectTypeOf<{
				content: Record<string, MediaTypeObject>;
			}>().toMatchTypeOf<RequestBodyObject>();
		});

		it("accepts full object", () => {
			expectTypeOf<{
				description: string;
				content: Record<string, MediaTypeObject>;
				required: boolean;
			}>().toMatchTypeOf<RequestBodyObject>();
		});

		it("rejects missing content", () => {
			expectTypeOf<{ description: string }>().not.toMatchTypeOf<RequestBodyObject>();
		});
	});

	describe("ResponseObject", () => {
		it("accepts minimal valid object", () => {
			expectTypeOf<{ description: string }>().toMatchTypeOf<ResponseObject>();
		});

		it("accepts full object", () => {
			expectTypeOf<{
				description: string;
				headers: Record<string, unknown>;
				content: Record<string, MediaTypeObject>;
				links: Record<string, unknown>;
			}>().toMatchTypeOf<ResponseObject>();
		});

		it("rejects missing description", () => {
			expectTypeOf<{ content: Record<string, MediaTypeObject> }>().not.toMatchTypeOf<ResponseObject>();
		});
	});

	describe("ExampleObject", () => {
		it("accepts empty object (all optional)", () => {
			expectTypeOf<{}>().toMatchTypeOf<ExampleObject>();
		});

		it("accepts full object", () => {
			expectTypeOf<{
				summary: string;
				description: string;
				value: unknown;
				externalValue: string;
			}>().toMatchTypeOf<ExampleObject>();
		});
	});

	describe("HeaderObject", () => {
		it("accepts empty object (all optional)", () => {
			expectTypeOf<{}>().toMatchTypeOf<HeaderObject>();
		});

		it("accepts full object", () => {
			expectTypeOf<{
				schema: SchemaOrRef;
				description: string;
				required: boolean;
				example: unknown;
			}>().toMatchTypeOf<HeaderObject>();
		});
	});

	describe("OperationObject", () => {
		it("accepts empty object (all optional)", () => {
			expectTypeOf<{}>().toMatchTypeOf<OperationObject>();
		});

		it("accepts vendor extensions", () => {
			expectTypeOf<{ "x-custom": string }>().toMatchTypeOf<OperationObject>();
		});

		it("accepts full object", () => {
			expectTypeOf<{
				operationId: string;
				summary: string;
				description: string;
				tags: string[];
				deprecated: boolean;
				security: SecurityRequirementObject[];
				parameters: ParameterObject[];
				requestBody: RequestBodyObject;
				responses: Record<string, ResponseObject | ReferenceObject>;
				externalDocs: ExternalDocsObject;
			}>().toMatchTypeOf<OperationObject>();
		});
	});

	describe("PathItemObject", () => {
		it("accepts empty object (all optional)", () => {
			expectTypeOf<{}>().toMatchTypeOf<PathItemObject>();
		});

		it("accepts all 8 HTTP method fields", () => {
			expectTypeOf<{
				get: OperationObject;
				post: OperationObject;
				put: OperationObject;
				patch: OperationObject;
				delete: OperationObject;
				head: OperationObject;
				options: OperationObject;
				trace: OperationObject;
			}>().toMatchTypeOf<PathItemObject>();
		});

		it("accepts summary, description, and parameters", () => {
			expectTypeOf<{
				summary: string;
				description: string;
				parameters: ParameterObject[];
			}>().toMatchTypeOf<PathItemObject>();
		});
	});

	describe("ComponentsObject", () => {
		it("accepts empty object (all optional)", () => {
			expectTypeOf<{}>().toMatchTypeOf<ComponentsObject>();
		});

		it("accepts full object", () => {
			expectTypeOf<{
				schemas: Record<string, SchemaOrRef>;
				securitySchemes: Record<string, SecuritySchemeObject>;
				responses: Record<string, ResponseObject>;
				parameters: Record<string, ParameterObject>;
				requestBodies: Record<string, RequestBodyObject>;
			}>().toMatchTypeOf<ComponentsObject>();
		});
	});

	describe("OpenAPIDocument", () => {
		it("accepts minimal valid document", () => {
			expectTypeOf<{
				openapi: string;
				info: InfoObject;
				paths: Record<string, PathItemObject>;
			}>().toMatchTypeOf<OpenAPIDocument>();
		});

		it("accepts full document", () => {
			expectTypeOf<{
				openapi: string;
				info: InfoObject;
				paths: Record<string, PathItemObject>;
				webhooks: Record<string, PathItemObject>;
				servers: ServerObject[];
				components: ComponentsObject;
				security: SecurityRequirementObject[];
				tags: TagObject[];
				externalDocs: ExternalDocsObject;
			}>().toMatchTypeOf<OpenAPIDocument>();
		});

		it("rejects missing openapi", () => {
			expectTypeOf<{
				info: InfoObject;
				paths: Record<string, PathItemObject>;
			}>().not.toMatchTypeOf<OpenAPIDocument>();
		});

		it("rejects missing info", () => {
			expectTypeOf<{
				openapi: string;
				paths: Record<string, PathItemObject>;
			}>().not.toMatchTypeOf<OpenAPIDocument>();
		});

		it("rejects missing paths", () => {
			expectTypeOf<{
				openapi: string;
				info: InfoObject;
			}>().not.toMatchTypeOf<OpenAPIDocument>();
		});
	});
});
