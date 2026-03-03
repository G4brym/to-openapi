import { describe, expect, it } from "vitest";
import { ToOpenapiError } from "../../src/errors";
import { parseRouteKey } from "../../src/paths";

describe("parseRouteKey", () => {
	it("parses simple GET route", () => {
		const result = parseRouteKey("GET /tasks");
		expect(result).toEqual({ method: "get", path: "/tasks", pathParams: [] });
	});

	it("converts :param to {param}", () => {
		const result = parseRouteKey("GET /tasks/:id");
		expect(result).toEqual({ method: "get", path: "/tasks/{id}", pathParams: ["id"] });
	});

	it("handles multiple colon params", () => {
		const result = parseRouteKey("GET /users/:userId/posts/:postId");
		expect(result).toEqual({
			method: "get",
			path: "/users/{userId}/posts/{postId}",
			pathParams: ["userId", "postId"],
		});
	});

	it("passes through {param} as-is", () => {
		const result = parseRouteKey("GET /tasks/{id}");
		expect(result).toEqual({ method: "get", path: "/tasks/{id}", pathParams: ["id"] });
	});

	it("handles mixed :param and {param} styles", () => {
		const result = parseRouteKey("GET /users/:userId/posts/{postId}");
		expect(result).toEqual({
			method: "get",
			path: "/users/{userId}/posts/{postId}",
			pathParams: ["userId", "postId"],
		});
	});

	it("is case-insensitive for methods", () => {
		expect(parseRouteKey("get /tasks").method).toBe("get");
		expect(parseRouteKey("Get /tasks").method).toBe("get");
		expect(parseRouteKey("GET /tasks").method).toBe("get");
	});

	it("supports all 8 HTTP methods", () => {
		const methods = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS", "TRACE"];
		for (const method of methods) {
			const result = parseRouteKey(`${method} /test`);
			expect(result.method).toBe(method.toLowerCase());
		}
	});

	it("handles root path", () => {
		const result = parseRouteKey("GET /");
		expect(result).toEqual({ method: "get", path: "/", pathParams: [] });
	});

	it("throws INVALID_ROUTE_KEY for missing method", () => {
		expect(() => parseRouteKey("/tasks")).toThrow(ToOpenapiError);
		try {
			parseRouteKey("/tasks");
		} catch (err) {
			expect((err as ToOpenapiError).code).toBe("INVALID_ROUTE_KEY");
		}
	});

	it("throws INVALID_ROUTE_KEY for invalid method", () => {
		expect(() => parseRouteKey("INVALID /tasks")).toThrow(ToOpenapiError);
		try {
			parseRouteKey("INVALID /tasks");
		} catch (err) {
			expect((err as ToOpenapiError).code).toBe("INVALID_ROUTE_KEY");
		}
	});

	it("throws INVALID_ROUTE_KEY for path not starting with /", () => {
		expect(() => parseRouteKey("GET tasks")).toThrow(ToOpenapiError);
	});

	it("handles extra whitespace between method and path", () => {
		const result = parseRouteKey("GET   /tasks");
		expect(result).toEqual({ method: "get", path: "/tasks", pathParams: [] });
	});

	it("handles path with no params", () => {
		const result = parseRouteKey("POST /users/register");
		expect(result).toEqual({ method: "post", path: "/users/register", pathParams: [] });
	});

	it("throws for empty string", () => {
		expect(() => parseRouteKey("")).toThrow(ToOpenapiError);
	});

	it("handles deeply nested path", () => {
		const result = parseRouteKey("GET /api/v1/users/:id/settings");
		expect(result).toEqual({
			method: "get",
			path: "/api/v1/users/{id}/settings",
			pathParams: ["id"],
		});
	});
});
