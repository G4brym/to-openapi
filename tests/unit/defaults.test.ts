import { describe, expect, it } from "vitest";
import { STATUS_DESCRIPTIONS, generateOperationId } from "../../src/defaults";

describe("STATUS_DESCRIPTIONS", () => {
	it("has description for 200", () => {
		expect(STATUS_DESCRIPTIONS[200]).toBe("Successful response");
	});

	it("has description for 201", () => {
		expect(STATUS_DESCRIPTIONS[201]).toBe("Resource created");
	});

	it("has description for 204", () => {
		expect(STATUS_DESCRIPTIONS[204]).toBe("No content");
	});

	it("has description for 400", () => {
		expect(STATUS_DESCRIPTIONS[400]).toBe("Bad request");
	});

	it("has description for 401", () => {
		expect(STATUS_DESCRIPTIONS[401]).toBe("Unauthorized");
	});

	it("has description for 403", () => {
		expect(STATUS_DESCRIPTIONS[403]).toBe("Forbidden");
	});

	it("has description for 404", () => {
		expect(STATUS_DESCRIPTIONS[404]).toBe("Not found");
	});

	it("has description for 500", () => {
		expect(STATUS_DESCRIPTIONS[500]).toBe("Internal server error");
	});

	it("returns undefined for unknown status codes", () => {
		expect(STATUS_DESCRIPTIONS[999]).toBeUndefined();
	});
});

describe("generateOperationId", () => {
	it("generates id for simple GET path", () => {
		expect(generateOperationId("GET", "/tasks")).toBe("get_tasks");
	});

	it("generates id for path with colon param", () => {
		expect(generateOperationId("GET", "/tasks/:id")).toBe("get_tasks_id");
	});

	it("generates id for path with brace param", () => {
		expect(generateOperationId("GET", "/tasks/{id}")).toBe("get_tasks_id");
	});

	it("generates id for nested path", () => {
		expect(generateOperationId("POST", "/users/:userId/posts")).toBe("post_users_userId_posts");
	});

	it("lowercases the method", () => {
		expect(generateOperationId("DELETE", "/tasks/:id")).toBe("delete_tasks_id");
	});

	it("handles root path", () => {
		expect(generateOperationId("GET", "/")).toBe("get");
	});

	it("handles path with trailing slash", () => {
		expect(generateOperationId("GET", "/tasks/")).toBe("get_tasks");
	});

	it("handles all HTTP methods", () => {
		const methods = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS", "TRACE"];
		for (const method of methods) {
			const result = generateOperationId(method, "/test");
			expect(result).toBe(`${method.toLowerCase()}_test`);
		}
	});

	it("handles multiple params", () => {
		expect(generateOperationId("GET", "/users/:userId/posts/:postId")).toBe(
			"get_users_userId_posts_postId",
		);
	});
});
