import { describe, expect, it } from "vitest";
import { expandRoute } from "../../src/shorthand";
import { SchemaResolver } from "../../src/resolver";
import { createMockObjectSchema, createMockSchema } from "../helpers/mock-schemas";
import type { ParsedRoute, RequestBodyObject, ResponseObject, RouteShorthand } from "../../src/types";

function makeResolver(version: "3.0.3" | "3.1.0" = "3.1.0") {
	return new SchemaResolver({ openapiVersion: version });
}

function makeParsed(overrides: Partial<ParsedRoute> = {}): ParsedRoute {
	return {
		method: "get",
		path: "/test",
		pathParams: [],
		...overrides,
	};
}

describe("expandRoute", () => {
	describe("query parameters", () => {
		it("expands query schema into individual parameters", () => {
			const resolver = makeResolver();
			const query = createMockObjectSchema(
				{ page: { type: "integer" }, limit: { type: "integer" } },
				["page"],
			);
			const op = expandRoute(makeParsed(), { query }, resolver);

			expect(op.parameters).toHaveLength(2);
			expect(op.parameters![0]).toEqual({
				name: "page",
				in: "query",
				schema: { type: "integer" },
				required: true,
			});
			expect(op.parameters![1]).toEqual({
				name: "limit",
				in: "query",
				schema: { type: "integer" },
			});
		});

		it("marks optional query params without required", () => {
			const resolver = makeResolver();
			const query = createMockObjectSchema({ q: { type: "string" } });
			const op = expandRoute(makeParsed(), { query }, resolver);

			expect(op.parameters![0]!.required).toBeUndefined();
		});
	});

	describe("path parameters", () => {
		it("expands params schema with path params all required", () => {
			const resolver = makeResolver();
			const params = createMockObjectSchema({ id: { type: "integer" } });
			const parsed = makeParsed({ path: "/tasks/{id}", pathParams: ["id"] });
			const op = expandRoute(parsed, { params }, resolver);

			expect(op.parameters).toHaveLength(1);
			expect(op.parameters![0]).toEqual({
				name: "id",
				in: "path",
				required: true,
				schema: { type: "integer" },
			});
		});

		it("auto-detects path params when no params schema provided", () => {
			const resolver = makeResolver();
			const parsed = makeParsed({ path: "/tasks/{id}", pathParams: ["id"] });
			const op = expandRoute(parsed, {}, resolver);

			expect(op.parameters).toHaveLength(1);
			expect(op.parameters![0]).toEqual({
				name: "id",
				in: "path",
				required: true,
				schema: { type: "string" },
			});
		});

		it("adds missing path params as string type", () => {
			const resolver = makeResolver();
			const params = createMockObjectSchema({ userId: { type: "integer" } });
			const parsed = makeParsed({
				path: "/users/{userId}/posts/{postId}",
				pathParams: ["userId", "postId"],
			});
			const op = expandRoute(parsed, { params }, resolver);

			expect(op.parameters).toHaveLength(2);
			const userParam = op.parameters!.find((p) => p.name === "userId");
			const postParam = op.parameters!.find((p) => p.name === "postId");
			expect(userParam!.schema).toEqual({ type: "integer" });
			expect(postParam!.schema).toEqual({ type: "string" });
		});
	});

	describe("header parameters", () => {
		it("expands headers schema into header parameters", () => {
			const resolver = makeResolver();
			const headers = createMockObjectSchema(
				{ "x-api-key": { type: "string" } },
				["x-api-key"],
			);
			const op = expandRoute(makeParsed(), { headers }, resolver);

			expect(op.parameters).toHaveLength(1);
			expect(op.parameters![0]).toEqual({
				name: "x-api-key",
				in: "header",
				schema: { type: "string" },
				required: true,
			});
		});
	});

	describe("request body", () => {
		it("wraps schema in application/json content", () => {
			const resolver = makeResolver();
			const body = createMockSchema({ type: "object", properties: { name: { type: "string" } } });
			const op = expandRoute(makeParsed({ method: "post" }), { body }, resolver);

			expect(op.requestBody).toEqual({
				content: {
					"application/json": {
						schema: { type: "object", properties: { name: { type: "string" } } },
					},
				},
			});
		});

		it("passes through full request body object", () => {
			const resolver = makeResolver();
			const body: RequestBodyObject = {
				content: {
					"multipart/form-data": {
						schema: { type: "object" },
					},
				},
			};
			const op = expandRoute(makeParsed({ method: "post" }), { body: body as any }, resolver);

			expect(op.requestBody).toEqual(body);
		});
	});

	describe("response shorthands", () => {
		it("expands null to description-only response", () => {
			const resolver = makeResolver();
			const definition: RouteShorthand = { 204: null };
			const op = expandRoute(makeParsed(), definition, resolver);

			expect(op.responses!["204"]).toEqual({ description: "No content" });
		});

		it("expands schema to json response", () => {
			const resolver = makeResolver();
			const schema = createMockSchema({ type: "object", properties: { id: { type: "string" } } });
			const definition: RouteShorthand = { 200: schema };
			const op = expandRoute(makeParsed(), definition, resolver);

			expect(op.responses!["200"]).toEqual({
				description: "Successful response",
				content: {
					"application/json": {
						schema: { type: "object", properties: { id: { type: "string" } } },
					},
				},
			});
		});

		it("expands string as named schema reference", () => {
			const resolver = makeResolver();
			const schema = createMockSchema({ type: "object" });
			resolver.registerNamed("Task", schema);

			const definition: RouteShorthand = { 200: "Task" as any };
			const op = expandRoute(makeParsed(), definition, resolver);

			expect(op.responses!["200"]).toEqual({
				description: "Successful response",
				content: {
					"application/json": {
						schema: { $ref: "#/components/schemas/Task" },
					},
				},
			});
		});

		it("passes through full response object", () => {
			const resolver = makeResolver();
			const response: ResponseObject = {
				description: "Custom response",
				content: { "text/plain": { schema: { type: "string" } } },
			};
			const definition: RouteShorthand = { 200: response as any };
			const op = expandRoute(makeParsed(), definition, resolver);

			expect(op.responses!["200"]).toEqual(response);
		});

		it("uses STATUS_DESCRIPTIONS for known codes", () => {
			const resolver = makeResolver();
			const schema = createMockSchema({ type: "object" });
			const definition: RouteShorthand = {
				400: schema,
				404: null,
				500: schema,
			};
			const op = expandRoute(makeParsed(), definition, resolver);

			expect(op.responses!["400"]!.description).toBe("Bad request");
			expect(op.responses!["404"]!.description).toBe("Not found");
			expect(op.responses!["500"]!.description).toBe("Internal server error");
		});

		it("uses fallback description for unknown status codes", () => {
			const resolver = makeResolver();
			const definition: RouteShorthand = { 418: null };
			const op = expandRoute(makeParsed(), definition, resolver);

			expect(op.responses!["418"]!.description).toBe("Response 418");
		});
	});

	describe("metadata", () => {
		it("copies summary", () => {
			const resolver = makeResolver();
			const op = expandRoute(makeParsed(), { summary: "Get things" }, resolver);
			expect(op.summary).toBe("Get things");
		});

		it("copies description", () => {
			const resolver = makeResolver();
			const op = expandRoute(makeParsed(), { description: "Detailed info" }, resolver);
			expect(op.description).toBe("Detailed info");
		});

		it("copies tags", () => {
			const resolver = makeResolver();
			const op = expandRoute(makeParsed(), { tags: ["tasks"] }, resolver);
			expect(op.tags).toEqual(["tasks"]);
		});

		it("copies deprecated", () => {
			const resolver = makeResolver();
			const op = expandRoute(makeParsed(), { deprecated: true }, resolver);
			expect(op.deprecated).toBe(true);
		});

		it("copies security", () => {
			const resolver = makeResolver();
			const op = expandRoute(makeParsed(), { security: [{ bearerAuth: [] }] }, resolver);
			expect(op.security).toEqual([{ bearerAuth: [] }]);
		});

		it("uses provided operationId", () => {
			const resolver = makeResolver();
			const op = expandRoute(makeParsed(), { operationId: "customId" }, resolver);
			expect(op.operationId).toBe("customId");
		});

		it("auto-generates operationId when not provided", () => {
			const resolver = makeResolver();
			const op = expandRoute(
				makeParsed({ method: "get", path: "/tasks/{id}" }),
				{},
				resolver,
			);
			expect(op.operationId).toBe("get_tasks_id");
		});
	});

	describe("combined parameters", () => {
		it("combines query, path, and header parameters", () => {
			const resolver = makeResolver();
			const query = createMockObjectSchema({ page: { type: "integer" } });
			const headers = createMockObjectSchema({ "x-token": { type: "string" } });
			const parsed = makeParsed({ path: "/items/{id}", pathParams: ["id"] });

			const op = expandRoute(parsed, { query, headers }, resolver);

			expect(op.parameters).toHaveLength(3);
			const types = op.parameters!.map((p) => p.in);
			expect(types).toContain("query");
			expect(types).toContain("path");
			expect(types).toContain("header");
		});
	});
});
