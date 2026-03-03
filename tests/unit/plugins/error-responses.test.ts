import { describe, expect, it } from "vitest";
import { errorResponses } from "../../../src/plugins/error-responses";
import { createMockSchema } from "../../helpers/mock-schemas";
import type { RouteDefinition } from "../../../src/types";

const baseRoute: RouteDefinition = {
	method: "get",
	path: "/tasks",
};

describe("errorResponses plugin", () => {
	it("has correct name", () => {
		const plugin = errorResponses([]);
		expect(plugin.name).toBe("errorResponses");
	});

	it("injects error status codes into route", () => {
		const plugin = errorResponses([{ status: 500 }]);
		const result = plugin.transformRoute!(baseRoute);
		expect((result as Record<string, unknown>)["500"]).toBeNull();
	});

	it("does not overwrite existing status codes", () => {
		const schema = createMockSchema({ type: "object" });
		const route: RouteDefinition = { ...baseRoute, 500: schema } as RouteDefinition;
		const plugin = errorResponses([{ status: 500 }]);
		const result = plugin.transformRoute!(route);
		expect((result as Record<string, unknown>)["500"]).toBe(schema);
	});

	it("injects multiple error responses", () => {
		const plugin = errorResponses([
			{ status: 400 },
			{ status: 401 },
			{ status: 500 },
		]);
		const result = plugin.transformRoute!(baseRoute) as Record<string, unknown>;
		expect(result["400"]).toBeNull();
		expect(result["401"]).toBeNull();
		expect(result["500"]).toBeNull();
	});

	it("supports schema in error entries", () => {
		const schema = createMockSchema({ type: "object", properties: { message: { type: "string" } } });
		const plugin = errorResponses([{ status: 400, schema }]);
		const result = plugin.transformRoute!(baseRoute) as Record<string, unknown>;
		expect(result["400"]).toBe(schema);
	});

	it("supports description in error entries", () => {
		const plugin = errorResponses([{ status: 503, description: "Service down" }]);
		const result = plugin.transformRoute!(baseRoute) as Record<string, unknown>;
		expect(result["503"]).toEqual({ description: "Service down" });
	});

	it("returns original route when nothing to add", () => {
		const plugin = errorResponses([]);
		const result = plugin.transformRoute!(baseRoute);
		expect(result).toBe(baseRoute);
	});

	it("returns original route when all codes already exist", () => {
		const route: RouteDefinition = { ...baseRoute, 400: null, 500: null } as RouteDefinition;
		const plugin = errorResponses([{ status: 400 }, { status: 500 }]);
		const result = plugin.transformRoute!(route);
		expect(result).toBe(route);
	});

	it("only adds missing codes", () => {
		const route: RouteDefinition = { ...baseRoute, 400: null } as RouteDefinition;
		const plugin = errorResponses([{ status: 400 }, { status: 500 }]);
		const result = plugin.transformRoute!(route) as Record<string, unknown>;
		expect(result["400"]).toBeNull();
		expect(result["500"]).toBeNull();
	});

	it("does not mutate original route", () => {
		const plugin = errorResponses([{ status: 500 }]);
		const route: RouteDefinition = { ...baseRoute };
		plugin.transformRoute!(route);
		expect((route as Record<string, unknown>)["500"]).toBeUndefined();
	});
});
