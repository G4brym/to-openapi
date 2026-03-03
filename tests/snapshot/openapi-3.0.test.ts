import { describe, expect, it } from "vitest";
import { openapi } from "../../src/openapi-fn";
import { createMockObjectSchema, createMockSchema } from "../helpers/mock-schemas";

describe("OpenAPI 3.0.3 snapshot", () => {
	it("generates a complete API document with 3.0.3 version", () => {
		const UserSchema = createMockSchema({
			type: "object",
			properties: {
				id: { type: "integer" },
				email: { type: "string", format: "email" },
				name: { type: "string" },
			},
			required: ["id", "email", "name"],
		});

		const doc = openapi({
			info: {
				title: "User API",
				version: "2.0.0",
			},
			openapi: "3.0.3",
			servers: [{ url: "https://api.users.example.com" }],
			schemas: {
				User: UserSchema,
			},
			securitySchemes: {
				bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
			},
			security: [{ bearerAuth: [] }],
			paths: {
				"GET /users": {
					summary: "List users",
					query: createMockObjectSchema({
						search: { type: "string" },
						role: { type: "string", enum: ["admin", "user"] },
					}),
					200: createMockSchema({
						type: "array",
						items: { $ref: "#/components/schemas/User" },
					}),
					401: null,
				},
				"GET /users/:id": {
					summary: "Get user by ID",
					params: createMockObjectSchema({ id: { type: "integer" } }),
					200: "User" as any,
					404: null,
				},
				"PUT /users/:id": {
					summary: "Update user",
					body: createMockSchema({
						type: "object",
						properties: {
							name: { type: "string" },
							email: { type: "string" },
						},
					}),
					200: "User" as any,
					400: null,
					404: null,
				},
			},
		});

		expect(doc.openapi).toBe("3.0.3");
		expect(doc).toMatchSnapshot();
	});
});
