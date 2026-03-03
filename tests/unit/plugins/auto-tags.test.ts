import { describe, expect, it } from "vitest";
import { autoTags } from "../../../src/plugins/auto-tags";
import type { RouteDefinition } from "../../../src/types";

const baseRoute: RouteDefinition = {
	method: "get",
	path: "/tasks",
};

describe("autoTags plugin", () => {
	it("has correct name", () => {
		const plugin = autoTags();
		expect(plugin.name).toBe("autoTags");
	});

	it("extracts first path segment as tag", () => {
		const plugin = autoTags();
		const result = plugin.transformRoute!(baseRoute);
		expect(result.tags).toEqual(["tasks"]);
	});

	it("skips routes with existing tags", () => {
		const plugin = autoTags();
		const route: RouteDefinition = { ...baseRoute, tags: ["custom"] };
		const result = plugin.transformRoute!(route);
		expect(result.tags).toEqual(["custom"]);
	});

	it("handles nested paths", () => {
		const plugin = autoTags();
		const route: RouteDefinition = { ...baseRoute, path: "/users/123/posts" };
		const result = plugin.transformRoute!(route);
		expect(result.tags).toEqual(["users"]);
	});

	it("handles root path", () => {
		const plugin = autoTags();
		const route: RouteDefinition = { ...baseRoute, path: "/" };
		const result = plugin.transformRoute!(route);
		expect(result.tags).toBeUndefined();
	});

	it("skips path param as first segment", () => {
		const plugin = autoTags();
		const route: RouteDefinition = { ...baseRoute, path: "/{version}/tasks" };
		const result = plugin.transformRoute!(route);
		expect(result.tags).toBeUndefined();
	});

	it("supports prefix option", () => {
		const plugin = autoTags({ prefix: "api:" });
		const result = plugin.transformRoute!(baseRoute);
		expect(result.tags).toEqual(["api:tasks"]);
	});

	it("handles path with params after first segment", () => {
		const plugin = autoTags();
		const route: RouteDefinition = { ...baseRoute, path: "/tasks/{id}" };
		const result = plugin.transformRoute!(route);
		expect(result.tags).toEqual(["tasks"]);
	});

	it("treats empty tags array as no tags", () => {
		const plugin = autoTags();
		const route: RouteDefinition = { ...baseRoute, tags: [] };
		const result = plugin.transformRoute!(route);
		expect(result.tags).toEqual(["tasks"]);
	});

	it("does not mutate original route", () => {
		const plugin = autoTags();
		const route: RouteDefinition = { ...baseRoute };
		plugin.transformRoute!(route);
		expect(route.tags).toBeUndefined();
	});
});
