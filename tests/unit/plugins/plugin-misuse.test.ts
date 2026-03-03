import { describe, expect, it } from "vitest";
import { ToOpenapiError } from "../../../src/errors";
import { openapi } from "../../../src/openapi-fn";
import { apiKeyAuth } from "../../../src/plugins/api-key-auth";
import { bearerAuth } from "../../../src/plugins/bearer-auth";
import { errorResponses } from "../../../src/plugins/error-responses";
import type { ToOpenapiPlugin } from "../../../src/types";
import { createMockSchema } from "../../helpers/mock-schemas";

const baseDefinition = {
	info: { title: "Test API", version: "1.0.0" },
};

describe("plugin misuse", () => {
	it("transformRoute that throws propagates error uncaught (not ToOpenapiError)", () => {
		const plugin: ToOpenapiPlugin = {
			name: "thrower",
			transformRoute: () => {
				throw new Error("plugin broke");
			},
		};

		expect(() =>
			openapi({
				...baseDefinition,
				plugins: [plugin],
				paths: { "GET /test": { 200: null } },
			}),
		).toThrow("plugin broke");

		// Verify it's a raw Error, not wrapped in ToOpenapiError
		try {
			openapi({
				...baseDefinition,
				plugins: [plugin],
				paths: { "GET /test": { 200: null } },
			});
		} catch (err) {
			expect(err).toBeInstanceOf(Error);
			expect(err).not.toBeInstanceOf(ToOpenapiError);
		}
	});

	it("transformDocument that throws propagates error uncaught", () => {
		const plugin: ToOpenapiPlugin = {
			name: "doc-thrower",
			transformDocument: () => {
				throw new Error("doc broke");
			},
		};

		expect(() =>
			openapi({
				...baseDefinition,
				plugins: [plugin],
				paths: {},
			}),
		).toThrow("doc broke");
	});

	it("transformSchema that throws propagates error uncaught", () => {
		const plugin: ToOpenapiPlugin = {
			name: "schema-thrower",
			transformSchema: () => {
				throw new Error("schema broke");
			},
		};

		expect(() =>
			openapi({
				...baseDefinition,
				plugins: [plugin],
				paths: {
					"POST /test": {
						body: createMockSchema({ type: "object" }),
						200: null,
					},
				},
			}),
		).toThrow("schema broke");
	});

	it("transformRoute returning undefined causes TypeError downstream", () => {
		const plugin: ToOpenapiPlugin = {
			name: "undefined-returner",
			transformRoute: () => undefined as any,
		};

		expect(() =>
			openapi({
				...baseDefinition,
				plugins: [plugin],
				paths: { "GET /test": { 200: null } },
			}),
		).toThrow(TypeError);
	});

	it("transformSchema returning undefined places undefined in output schema", () => {
		const plugin: ToOpenapiPlugin = {
			name: "schema-undefined",
			transformSchema: () => undefined as any,
		};

		const doc = openapi({
			...baseDefinition,
			plugins: [plugin],
			paths: {
				"POST /test": {
					body: createMockSchema({ type: "object" }),
					200: null,
				},
			},
		});

		const bodySchema = (doc.paths["/test"]?.post?.requestBody as any)?.content?.[
			"application/json"
		]?.schema;
		expect(bodySchema).toBeUndefined();
	});

	it("bearerAuth with empty schemeName creates empty-key security scheme", () => {
		const plugin = bearerAuth({ schemeName: "" });

		const doc = openapi({
			...baseDefinition,
			plugins: [plugin],
			paths: { "GET /test": { 200: null } },
		});

		expect(doc.components?.securitySchemes?.[""]).toBeDefined();
		expect(doc.paths["/test"]?.get?.security).toEqual([{ "": [] }]);
	});

	it("apiKeyAuth with empty name produces empty name in scheme", () => {
		const plugin = apiKeyAuth({ name: "", in: "header" });

		const doc = openapi({
			...baseDefinition,
			plugins: [plugin],
			paths: { "GET /test": { 200: null } },
		});

		const scheme = doc.components?.securitySchemes?.apiKeyAuth as any;
		expect(scheme).toBeDefined();
		expect(scheme.name).toBe("");
	});

	it("errorResponses with out-of-range status 99 is added but skipped by expandRoute", () => {
		const plugin = errorResponses([{ status: 99, description: "Too low" }]);

		const doc = openapi({
			...baseDefinition,
			plugins: [plugin],
			paths: { "GET /test": { 200: null } },
		});

		// Status 99 is below the 100-599 range, so it's skipped during response expansion
		expect(doc.paths["/test"]?.get?.responses?.["99"]).toBeUndefined();
		// But the valid 200 response is still there
		expect(doc.paths["/test"]?.get?.responses?.["200"]).toBeDefined();
	});
});
