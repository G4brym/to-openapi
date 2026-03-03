import { describe, expect, it } from "vitest";
import { bearerAuth } from "../../../src/plugins/bearer-auth";
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

describe("bearerAuth plugin", () => {
	it("has correct name", () => {
		const plugin = bearerAuth();
		expect(plugin.name).toBe("bearerAuth");
	});

	it("adds security to routes", () => {
		const plugin = bearerAuth();
		const result = plugin.transformRoute!(baseRoute);
		expect(result.security).toEqual([{ bearerAuth: [] }]);
	});

	it("does not overwrite existing route security", () => {
		const plugin = bearerAuth();
		const route: RouteDefinition = { ...baseRoute, security: [{ apiKey: [] }] };
		const result = plugin.transformRoute!(route);
		expect(result.security).toEqual([{ apiKey: [] }]);
	});

	it("excludes specified paths", () => {
		const plugin = bearerAuth({ exclude: ["/health", "/login"] });
		const result = plugin.transformRoute!({ ...baseRoute, path: "/health" });
		expect(result.security).toBeUndefined();
	});

	it("applies to non-excluded paths", () => {
		const plugin = bearerAuth({ exclude: ["/health"] });
		const result = plugin.transformRoute!(baseRoute);
		expect(result.security).toEqual([{ bearerAuth: [] }]);
	});

	it("injects securityScheme into document", () => {
		const plugin = bearerAuth();
		const result = plugin.transformDocument!(baseDoc);
		expect(result.components?.securitySchemes?.bearerAuth).toEqual({
			type: "http",
			scheme: "bearer",
		});
	});

	it("adds global security to document", () => {
		const plugin = bearerAuth();
		const result = plugin.transformDocument!(baseDoc);
		expect(result.security).toEqual([{ bearerAuth: [] }]);
	});

	it("does not overwrite existing document security", () => {
		const plugin = bearerAuth();
		const doc: OpenAPIDocument = { ...baseDoc, security: [{ apiKey: [] }] };
		const result = plugin.transformDocument!(doc);
		expect(result.security).toEqual([{ apiKey: [] }]);
	});

	it("supports custom scheme name", () => {
		const plugin = bearerAuth({ schemeName: "jwt" });
		const route = plugin.transformRoute!(baseRoute);
		expect(route.security).toEqual([{ jwt: [] }]);

		const doc = plugin.transformDocument!(baseDoc);
		expect(doc.components?.securitySchemes?.jwt).toBeDefined();
	});

	it("supports bearerFormat option", () => {
		const plugin = bearerAuth({ bearerFormat: "JWT" });
		const doc = plugin.transformDocument!(baseDoc);
		expect(doc.components?.securitySchemes?.bearerAuth).toEqual({
			type: "http",
			scheme: "bearer",
			bearerFormat: "JWT",
		});
	});

	it("preserves existing component schemas", () => {
		const plugin = bearerAuth();
		const doc: OpenAPIDocument = {
			...baseDoc,
			components: { schemas: { Task: { type: "object" } } },
		};
		const result = plugin.transformDocument!(doc);
		expect(result.components?.schemas?.Task).toEqual({ type: "object" });
		expect(result.components?.securitySchemes?.bearerAuth).toBeDefined();
	});
});
