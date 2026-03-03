import { describe, expect, it } from "vitest";
import { SchemaResolver } from "../../src/resolver";
import { expandRoute } from "../../src/shorthand";
import type {
	ParsedRoute,
	RequestBodyObject,
	ResponseObject,
	RouteShorthand,
} from "../../src/types";
import { createMockObjectSchema, createMockSchema } from "../helpers/mock-schemas";

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
			expect(op.parameters?.[0]).toEqual({
				name: "page",
				in: "query",
				schema: { type: "integer" },
				required: true,
			});
			expect(op.parameters?.[1]).toEqual({
				name: "limit",
				in: "query",
				schema: { type: "integer" },
			});
		});

		it("marks optional query params without required", () => {
			const resolver = makeResolver();
			const query = createMockObjectSchema({ q: { type: "string" } });
			const op = expandRoute(makeParsed(), { query }, resolver);

			expect(op.parameters?.[0]?.required).toBeUndefined();
		});
	});

	describe("path parameters", () => {
		it("expands params schema with path params all required", () => {
			const resolver = makeResolver();
			const params = createMockObjectSchema({ id: { type: "integer" } });
			const parsed = makeParsed({ path: "/tasks/{id}", pathParams: ["id"] });
			const op = expandRoute(parsed, { params }, resolver);

			expect(op.parameters).toHaveLength(1);
			expect(op.parameters?.[0]).toEqual({
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
			expect(op.parameters?.[0]).toEqual({
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
			const userParam = op.parameters?.find((p) => p.name === "userId");
			const postParam = op.parameters?.find((p) => p.name === "postId");
			expect(userParam?.schema).toEqual({ type: "integer" });
			expect(postParam?.schema).toEqual({ type: "string" });
		});
	});

	describe("header parameters", () => {
		it("expands headers schema into header parameters", () => {
			const resolver = makeResolver();
			const headers = createMockObjectSchema({ "x-api-key": { type: "string" } }, ["x-api-key"]);
			const op = expandRoute(makeParsed(), { headers }, resolver);

			expect(op.parameters).toHaveLength(1);
			expect(op.parameters?.[0]).toEqual({
				name: "x-api-key",
				in: "header",
				schema: { type: "string" },
				required: true,
			});
		});
	});

	describe("deprecated parameters", () => {
		it("propagates deprecated from query property schema", () => {
			const resolver = makeResolver();
			const query = createMockObjectSchema({
				oldParam: { type: "string", deprecated: true },
				newParam: { type: "string" },
			});
			const op = expandRoute(makeParsed(), { query }, resolver);

			const oldParam = op.parameters?.find((p) => p.name === "oldParam");
			const newParam = op.parameters?.find((p) => p.name === "newParam");
			expect(oldParam?.deprecated).toBe(true);
			expect(newParam?.deprecated).toBeUndefined();
		});

		it("propagates deprecated from path property schema", () => {
			const resolver = makeResolver();
			const params = createMockObjectSchema({
				id: { type: "string", deprecated: true },
			});
			const parsed = makeParsed({ path: "/items/{id}", pathParams: ["id"] });
			const op = expandRoute(parsed, { params }, resolver);

			expect(op.parameters?.[0]?.deprecated).toBe(true);
		});

		it("propagates deprecated from header property schema", () => {
			const resolver = makeResolver();
			const headers = createMockObjectSchema({
				"x-old-header": { type: "string", deprecated: true },
			});
			const op = expandRoute(makeParsed(), { headers }, resolver);

			expect(op.parameters?.[0]?.deprecated).toBe(true);
		});

		it("propagates deprecated from cookie property schema", () => {
			const resolver = makeResolver();
			const cookies = createMockObjectSchema({
				oldCookie: { type: "string", deprecated: true },
			});
			const op = expandRoute(makeParsed(), { cookies }, resolver);

			expect(op.parameters?.[0]?.deprecated).toBe(true);
		});

		it("does not set deprecated when not present in schema", () => {
			const resolver = makeResolver();
			const query = createMockObjectSchema({ active: { type: "string" } });
			const op = expandRoute(makeParsed(), { query }, resolver);

			expect(op.parameters?.[0]?.deprecated).toBeUndefined();
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

			expect(op.responses?.["204"]).toEqual({ description: "No content" });
		});

		it("expands schema to json response", () => {
			const resolver = makeResolver();
			const schema = createMockSchema({ type: "object", properties: { id: { type: "string" } } });
			const definition: RouteShorthand = { 200: schema };
			const op = expandRoute(makeParsed(), definition, resolver);

			expect(op.responses?.["200"]).toEqual({
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

			expect(op.responses?.["200"]).toEqual({
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

			expect(op.responses?.["200"]).toEqual(response);
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

			expect(op.responses?.["400"]?.description).toBe("Bad request");
			expect(op.responses?.["404"]?.description).toBe("Not found");
			expect(op.responses?.["500"]?.description).toBe("Internal server error");
		});

		it("uses fallback description for unknown status codes", () => {
			const resolver = makeResolver();
			const definition: RouteShorthand = { 418: null };
			const op = expandRoute(makeParsed(), definition, resolver);

			expect(op.responses?.["418"]?.description).toBe("Response 418");
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
			const op = expandRoute(makeParsed({ method: "get", path: "/tasks/{id}" }), {}, resolver);
			expect(op.operationId).toBe("get_tasks_id");
		});
	});

	describe("$ref handling in param expansion", () => {
		it("expands query params even when schema is promoted to $ref", () => {
			const resolver = makeResolver();
			const query = createMockObjectSchema(
				{ page: { type: "integer" }, limit: { type: "integer" } },
				["page"],
			);

			// First use: inlined
			const op1 = expandRoute(makeParsed({ method: "get", path: "/tasks" }), { query }, resolver);
			expect(op1.parameters).toHaveLength(2);

			// Second use: would be promoted to $ref internally, but params should still expand
			const op2 = expandRoute(makeParsed({ method: "get", path: "/users" }), { query }, resolver);
			expect(op2.parameters).toHaveLength(2);
			expect(op2.parameters?.[0]?.name).toBe("page");
			expect(op2.parameters?.[0]?.required).toBe(true);
			expect(op2.parameters?.[1]?.name).toBe("limit");
		});
	});

	describe("cookie parameters", () => {
		it("expands cookies schema into cookie parameters", () => {
			const resolver = makeResolver();
			const cookies = createMockObjectSchema(
				{ session: { type: "string" }, theme: { type: "string" } },
				["session"],
			);
			const op = expandRoute(makeParsed(), { cookies }, resolver);

			expect(op.parameters).toHaveLength(2);
			expect(op.parameters?.[0]).toEqual({
				name: "session",
				in: "cookie",
				schema: { type: "string" },
				required: true,
			});
			expect(op.parameters?.[1]).toEqual({
				name: "theme",
				in: "cookie",
				schema: { type: "string" },
			});
		});

		it("marks optional cookie params without required", () => {
			const resolver = makeResolver();
			const cookies = createMockObjectSchema({ preference: { type: "string" } });
			const op = expandRoute(makeParsed(), { cookies }, resolver);

			expect(op.parameters?.[0]?.required).toBeUndefined();
		});

		it("combines cookie and query parameters", () => {
			const resolver = makeResolver();
			const query = createMockObjectSchema({ page: { type: "integer" } });
			const cookies = createMockObjectSchema({ session: { type: "string" } });
			const op = expandRoute(makeParsed(), { query, cookies }, resolver);

			expect(op.parameters).toHaveLength(2);
			const types = op.parameters?.map((p) => p.in);
			expect(types).toContain("query");
			expect(types).toContain("cookie");
		});
	});

	describe("combined parameters", () => {
		it("combines query, path, header, and cookie parameters", () => {
			const resolver = makeResolver();
			const query = createMockObjectSchema({ page: { type: "integer" } });
			const headers = createMockObjectSchema({ "x-token": { type: "string" } });
			const cookies = createMockObjectSchema({ session: { type: "string" } });
			const parsed = makeParsed({ path: "/items/{id}", pathParams: ["id"] });

			const op = expandRoute(parsed, { query, headers, cookies }, resolver);

			expect(op.parameters).toHaveLength(4);
			const types = op.parameters?.map((p) => p.in);
			expect(types).toContain("query");
			expect(types).toContain("path");
			expect(types).toContain("header");
			expect(types).toContain("cookie");
		});
	});
});
