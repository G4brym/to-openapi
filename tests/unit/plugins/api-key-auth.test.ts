import { describe, expect, it } from "vitest";
import { apiKeyAuth } from "../../../src/plugins/api-key-auth";
import type { OpenAPIDocument, RouteDefinition } from "../../../src/types";

const baseRoute: RouteDefinition = {
	method: "get",
	path: "/tasks",
};

const baseDoc: OpenAPIDocument = {
	openapi: "3.1.0",
	info: { title: "Test", version: "1.0.0" },
	paths: {},
};

describe("apiKeyAuth plugin", () => {
	it("has correct name", () => {
		const plugin = apiKeyAuth({ name: "X-API-Key", in: "header" });
		expect(plugin.name).toBe("apiKeyAuth");
	});

	it("adds security to routes", () => {
		const plugin = apiKeyAuth({ name: "X-API-Key", in: "header" });
		const result = plugin.transformRoute?.(baseRoute);
		expect(result.security).toEqual([{ apiKeyAuth: [] }]);
	});

	it("does not overwrite existing route security", () => {
		const plugin = apiKeyAuth({ name: "X-API-Key", in: "header" });
		const route: RouteDefinition = { ...baseRoute, security: [{ bearerAuth: [] }] };
		const result = plugin.transformRoute?.(route);
		expect(result.security).toEqual([{ bearerAuth: [] }]);
	});

	it("excludes specified paths", () => {
		const plugin = apiKeyAuth({ name: "X-API-Key", in: "header", exclude: ["/health", "/login"] });
		const result = plugin.transformRoute?.({ ...baseRoute, path: "/health" });
		expect(result.security).toBeUndefined();
	});

	it("applies to non-excluded paths", () => {
		const plugin = apiKeyAuth({ name: "X-API-Key", in: "header", exclude: ["/health"] });
		const result = plugin.transformRoute?.(baseRoute);
		expect(result.security).toEqual([{ apiKeyAuth: [] }]);
	});

	it("injects securityScheme with header location", () => {
		const plugin = apiKeyAuth({ name: "X-API-Key", in: "header" });
		const result = plugin.transformDocument?.(baseDoc);
		expect(result.components?.securitySchemes?.apiKeyAuth).toEqual({
			type: "apiKey",
			name: "X-API-Key",
			in: "header",
		});
	});

	it("injects securityScheme with query location", () => {
		const plugin = apiKeyAuth({ name: "api_key", in: "query" });
		const result = plugin.transformDocument?.(baseDoc);
		expect(result.components?.securitySchemes?.apiKeyAuth).toEqual({
			type: "apiKey",
			name: "api_key",
			in: "query",
		});
	});

	it("injects securityScheme with cookie location", () => {
		const plugin = apiKeyAuth({ name: "session", in: "cookie" });
		const result = plugin.transformDocument?.(baseDoc);
		expect(result.components?.securitySchemes?.apiKeyAuth).toEqual({
			type: "apiKey",
			name: "session",
			in: "cookie",
		});
	});

	it("adds global security to document", () => {
		const plugin = apiKeyAuth({ name: "X-API-Key", in: "header" });
		const result = plugin.transformDocument?.(baseDoc);
		expect(result.security).toEqual([{ apiKeyAuth: [] }]);
	});

	it("does not overwrite existing document security", () => {
		const plugin = apiKeyAuth({ name: "X-API-Key", in: "header" });
		const doc: OpenAPIDocument = { ...baseDoc, security: [{ bearerAuth: [] }] };
		const result = plugin.transformDocument?.(doc);
		expect(result.security).toEqual([{ bearerAuth: [] }]);
	});

	it("supports custom scheme name", () => {
		const plugin = apiKeyAuth({ schemeName: "myApiKey", name: "X-API-Key", in: "header" });
		const route = plugin.transformRoute?.(baseRoute);
		expect(route.security).toEqual([{ myApiKey: [] }]);

		const doc = plugin.transformDocument?.(baseDoc);
		expect(doc.components?.securitySchemes?.myApiKey).toBeDefined();
		expect(doc.components?.securitySchemes?.apiKeyAuth).toBeUndefined();
	});

	it("supports description option", () => {
		const plugin = apiKeyAuth({
			name: "X-API-Key",
			in: "header",
			description: "API key for authentication",
		});
		const doc = plugin.transformDocument?.(baseDoc);
		expect(doc.components?.securitySchemes?.apiKeyAuth).toEqual({
			type: "apiKey",
			name: "X-API-Key",
			in: "header",
			description: "API key for authentication",
		});
	});

	it("preserves existing component schemas", () => {
		const plugin = apiKeyAuth({ name: "X-API-Key", in: "header" });
		const doc: OpenAPIDocument = {
			...baseDoc,
			components: { schemas: { Task: { type: "object" } } },
		};
		const result = plugin.transformDocument?.(doc);
		expect(result.components?.schemas?.Task).toEqual({ type: "object" });
		expect(result.components?.securitySchemes?.apiKeyAuth).toBeDefined();
	});
});
