import { describe, expect, it } from "vitest";
import { openapi } from "../../src/openapi-fn";
import { createMockObjectSchema, createMockSchema } from "../helpers/mock-schemas";

describe("OpenAPI 3.1.0 snapshot", () => {
	it("generates a complete API document", () => {
		const TaskSchema = createMockSchema({
			type: "object",
			properties: {
				id: { type: "string", format: "uuid" },
				title: { type: "string" },
				completed: { type: "boolean" },
			},
			required: ["id", "title", "completed"],
		});

		const CreateTaskSchema = createMockSchema({
			type: "object",
			properties: {
				title: { type: "string" },
				description: { type: ["string", "null"] },
			},
			required: ["title"],
		});

		const ErrorSchema = createMockSchema({
			type: "object",
			properties: {
				message: { type: "string" },
				code: { type: "integer" },
			},
			required: ["message", "code"],
		});

		const doc = openapi({
			info: {
				title: "Task Manager API",
				version: "1.0.0",
				description: "A simple task management API",
			},
			openapi: "3.1.0",
			servers: [{ url: "https://api.tasks.example.com/v1" }],
			tags: [{ name: "tasks", description: "Task operations" }],
			schemas: {
				Task: TaskSchema,
				CreateTask: CreateTaskSchema,
				Error: ErrorSchema,
			},
			paths: {
				"GET /tasks": {
					summary: "List all tasks",
					tags: ["tasks"],
					query: createMockObjectSchema(
						{
							page: { type: "integer", minimum: 1 },
							limit: { type: "integer", minimum: 1, maximum: 100 },
						},
					),
					200: createMockSchema({
						type: "array",
						items: { $ref: "#/components/schemas/Task" },
					}),
				},
				"POST /tasks": {
					summary: "Create a task",
					tags: ["tasks"],
					body: CreateTaskSchema,
					201: "Task" as any,
					400: "Error" as any,
				},
				"GET /tasks/:id": {
					summary: "Get a task by ID",
					tags: ["tasks"],
					200: "Task" as any,
					404: null,
				},
				"DELETE /tasks/:id": {
					summary: "Delete a task",
					tags: ["tasks"],
					204: null,
					404: null,
				},
			},
		});

		expect(doc.openapi).toBe("3.1.0");
		expect(doc).toMatchSnapshot();
	});
});
