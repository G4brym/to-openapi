import { describe, expect, it } from "vitest";
import { z } from "zod";
import { merge } from "../../src/merge.js";
import { OpenAPI } from "../../src/openapi-class.js";
import { openapi } from "../../src/openapi-fn.js";
import { assertValidOpenAPI } from "../helpers/validate.js";

describe("docs/examples/crud-api — Task Management", () => {
	// Shared schemas for both API styles
	const TaskSchema = z.object({
		id: z.string().uuid(),
		title: z.string(),
		description: z.string().optional(),
		status: z.enum(["todo", "in-progress", "done"]),
		createdAt: z.string().datetime(),
	});

	const CreateTaskSchema = z.object({
		title: z.string().min(1),
		description: z.string().optional(),
	});

	const UpdateTaskSchema = z.object({
		title: z.string().min(1).optional(),
		description: z.string().optional(),
		status: z.enum(["todo", "in-progress", "done"]).optional(),
	});

	const TaskListSchema = z.object({
		tasks: z.array(TaskSchema),
		total: z.number(),
	});

	const TaskQuerySchema = z.object({
		status: z.string().optional(),
		page: z.number().optional(),
		limit: z.number().optional(),
	});

	const ErrorSchema = z.object({
		message: z.string(),
		code: z.string(),
	});

	it("declarative openapi() with full CRUD", async () => {
		const spec = openapi({
			info: {
				title: "Task Management API",
				version: "1.0.0",
				description: "A complete task management service",
			},
			servers: [
				{ url: "https://api.example.com/v1", description: "Production" },
				{ url: "http://localhost:3000/v1", description: "Local development" },
			],
			tags: [{ name: "Tasks", description: "Task management operations" }],
			schemas: {
				Task: TaskSchema,
				CreateTask: CreateTaskSchema,
				UpdateTask: UpdateTaskSchema,
				TaskList: TaskListSchema,
				Error: ErrorSchema,
			},
			paths: {
				"GET /tasks": {
					summary: "List all tasks",
					description: "Retrieve a paginated list of tasks, optionally filtered by status.",
					tags: ["Tasks"],
					operationId: "listTasks",
					query: TaskQuerySchema,
					200: TaskListSchema,
					400: ErrorSchema,
				},
				"POST /tasks": {
					summary: "Create a task",
					description: "Create a new task with a title and optional description.",
					tags: ["Tasks"],
					operationId: "createTask",
					body: CreateTaskSchema,
					201: TaskSchema,
					400: ErrorSchema,
				},
				"GET /tasks/{id}": {
					summary: "Get a task",
					description: "Retrieve a single task by its unique identifier.",
					tags: ["Tasks"],
					operationId: "getTask",
					200: TaskSchema,
					404: ErrorSchema,
				},
				"PUT /tasks/{id}": {
					summary: "Update a task",
					description: "Replace all fields of an existing task.",
					tags: ["Tasks"],
					operationId: "updateTask",
					body: UpdateTaskSchema,
					200: TaskSchema,
					404: ErrorSchema,
				},
				"DELETE /tasks/{id}": {
					summary: "Delete a task",
					description: "Permanently remove a task.",
					tags: ["Tasks"],
					operationId: "deleteTask",
					204: null,
					404: ErrorSchema,
				},
			},
		});

		await assertValidOpenAPI(spec);

		// Verify all CRUD paths
		expect(spec.paths["/tasks"]?.get).toBeDefined();
		expect(spec.paths["/tasks"]?.post).toBeDefined();
		expect(spec.paths["/tasks/{id}"]?.get).toBeDefined();
		expect(spec.paths["/tasks/{id}"]?.put).toBeDefined();
		expect(spec.paths["/tasks/{id}"]?.delete).toBeDefined();

		// Verify operation IDs
		expect(spec.paths["/tasks"]?.get?.operationId).toBe("listTasks");
		expect(spec.paths["/tasks"]?.post?.operationId).toBe("createTask");
		expect(spec.paths["/tasks/{id}"]?.get?.operationId).toBe("getTask");
		expect(spec.paths["/tasks/{id}"]?.put?.operationId).toBe("updateTask");
		expect(spec.paths["/tasks/{id}"]?.delete?.operationId).toBe("deleteTask");

		// Verify named schemas in components
		expect(spec.components?.schemas?.Task).toBeDefined();
		expect(spec.components?.schemas?.CreateTask).toBeDefined();
		expect(spec.components?.schemas?.UpdateTask).toBeDefined();
		expect(spec.components?.schemas?.TaskList).toBeDefined();
		expect(spec.components?.schemas?.Error).toBeDefined();

		// Verify query parameters on list endpoint
		const listParams = spec.paths["/tasks"]?.get?.parameters;
		expect(listParams).toBeDefined();

		// Verify 204 no content on delete
		const deleteResp = spec.paths["/tasks/{id}"]?.delete?.responses?.["204"] as any;
		expect(deleteResp.content).toBeUndefined();

		// Verify path parameter on GET /tasks/{id}
		const getParams = spec.paths["/tasks/{id}"]?.get?.parameters;
		expect(getParams).toBeDefined();
		const idParam = getParams!.find((p: any) => p.name === "id");
		expect(idParam).toBeDefined();
		expect((idParam as any).in).toBe("path");
		expect((idParam as any).required).toBe(true);
	});

	it("class-based API with same CRUD operations", async () => {
		const api = new OpenAPI({
			info: {
				title: "Task Management API",
				version: "1.0.0",
				description: "A complete task management service",
			},
			servers: [{ url: "https://api.example.com/v1", description: "Production" }],
			tags: [{ name: "Tasks", description: "Task management operations" }],
		});

		api.schema("Task", TaskSchema);
		api.schema("CreateTask", CreateTaskSchema);
		api.schema("Error", ErrorSchema);

		api.route("get", "/tasks", {
			summary: "List all tasks",
			tags: ["Tasks"],
			query: TaskQuerySchema,
			200: TaskListSchema,
		});

		api.route("post", "/tasks", {
			summary: "Create a task",
			tags: ["Tasks"],
			body: CreateTaskSchema,
			201: TaskSchema,
			400: ErrorSchema,
		});

		api.route("get", "/tasks/{id}", {
			summary: "Get a task",
			tags: ["Tasks"],
			200: TaskSchema,
			404: ErrorSchema,
		});

		api.route("put", "/tasks/{id}", {
			summary: "Update a task",
			tags: ["Tasks"],
			body: UpdateTaskSchema,
			200: TaskSchema,
			404: ErrorSchema,
		});

		api.route("delete", "/tasks/{id}", {
			summary: "Delete a task",
			tags: ["Tasks"],
			204: null,
			404: ErrorSchema,
		});

		const spec = api.document();

		await assertValidOpenAPI(spec);

		expect(spec.paths["/tasks"]?.get).toBeDefined();
		expect(spec.paths["/tasks"]?.post).toBeDefined();
		expect(spec.paths["/tasks/{id}"]?.get).toBeDefined();
		expect(spec.paths["/tasks/{id}"]?.put).toBeDefined();
		expect(spec.paths["/tasks/{id}"]?.delete).toBeDefined();
		expect(spec.components?.schemas?.Task).toBeDefined();
		expect(spec.components?.schemas?.CreateTask).toBeDefined();
		expect(spec.components?.schemas?.Error).toBeDefined();
	});
});

describe("docs/examples/microservices — E-Commerce Gateway", () => {
	it("merges users, orders, and products services", async () => {
		// --- Users Service ---
		const UserSchema = z.object({
			id: z.string().uuid(),
			name: z.string(),
			email: z.string().email(),
			role: z.enum(["admin", "member"]),
		});

		const CreateUserSchema = z.object({
			name: z.string().min(1),
			email: z.string().email(),
			role: z.enum(["admin", "member"]).default("member"),
		});

		const UserErrorSchema = z.object({
			message: z.string(),
			code: z.string(),
		});

		const usersSpec = openapi({
			info: { title: "Users Service", version: "1.0.0" },
			tags: [{ name: "Users", description: "User account management" }],
			securitySchemes: {
				bearerAuth: {
					type: "http",
					scheme: "bearer",
					bearerFormat: "JWT",
				},
			},
			schemas: {
				User: UserSchema,
				CreateUser: CreateUserSchema,
				UserError: UserErrorSchema,
			},
			paths: {
				"GET /users": {
					summary: "List users",
					tags: ["Users"],
					operationId: "listUsers",
					200: UserSchema,
				},
				"POST /users": {
					summary: "Create user",
					tags: ["Users"],
					operationId: "createUser",
					body: CreateUserSchema,
					201: UserSchema,
					400: UserErrorSchema,
				},
				"GET /users/{id}": {
					summary: "Get user by ID",
					tags: ["Users"],
					operationId: "getUser",
					200: UserSchema,
					404: UserErrorSchema,
				},
				"DELETE /users/{id}": {
					summary: "Delete user",
					tags: ["Users"],
					operationId: "deleteUser",
					204: null,
					404: UserErrorSchema,
				},
			},
		});

		// --- Orders Service ---
		const OrderItemSchema = z.object({
			productId: z.string().uuid(),
			quantity: z.number().int().positive(),
			unitPrice: z.number().positive(),
		});

		const OrderSchema = z.object({
			id: z.string().uuid(),
			userId: z.string().uuid(),
			items: z.array(OrderItemSchema),
			total: z.number(),
			status: z.enum(["pending", "confirmed", "shipped", "delivered", "cancelled"]),
			createdAt: z.string().datetime(),
		});

		const CreateOrderSchema = z.object({
			userId: z.string().uuid(),
			items: z.array(
				z.object({
					productId: z.string().uuid(),
					quantity: z.number().int().positive(),
				}),
			),
		});

		const OrderErrorSchema = z.object({
			message: z.string(),
			code: z.string(),
		});

		const ordersSpec = openapi({
			info: { title: "Orders Service", version: "1.0.0" },
			tags: [{ name: "Orders", description: "Order processing and management" }],
			schemas: {
				Order: OrderSchema,
				OrderItem: OrderItemSchema,
				CreateOrder: CreateOrderSchema,
				OrderError: OrderErrorSchema,
			},
			paths: {
				"GET /orders": {
					summary: "List orders",
					tags: ["Orders"],
					operationId: "listOrders",
					query: z.object({
						userId: z.string().uuid().optional(),
						status: z
							.enum(["pending", "confirmed", "shipped", "delivered", "cancelled"])
							.optional(),
					}),
					200: OrderSchema,
				},
				"POST /orders": {
					summary: "Create order",
					tags: ["Orders"],
					operationId: "createOrder",
					body: CreateOrderSchema,
					201: OrderSchema,
					400: OrderErrorSchema,
				},
				"GET /orders/{id}": {
					summary: "Get order by ID",
					tags: ["Orders"],
					operationId: "getOrder",
					200: OrderSchema,
					404: OrderErrorSchema,
				},
				"PUT /orders/{id}/cancel": {
					summary: "Cancel order",
					tags: ["Orders"],
					operationId: "cancelOrder",
					200: OrderSchema,
					404: OrderErrorSchema,
				},
			},
		});

		// --- Products Service ---
		const ProductSchema = z.object({
			id: z.string().uuid(),
			name: z.string(),
			description: z.string(),
			price: z.number().positive(),
			category: z.string(),
			inStock: z.boolean(),
		});

		const CreateProductSchema = z.object({
			name: z.string().min(1),
			description: z.string(),
			price: z.number().positive(),
			category: z.string(),
		});

		const UpdateProductSchema = z.object({
			name: z.string().min(1).optional(),
			description: z.string().optional(),
			price: z.number().positive().optional(),
			category: z.string().optional(),
			inStock: z.boolean().optional(),
		});

		const ProductErrorSchema = z.object({
			message: z.string(),
			code: z.string(),
		});

		const productsSpec = openapi({
			info: { title: "Products Service", version: "1.0.0" },
			tags: [{ name: "Products", description: "Product catalog management" }],
			schemas: {
				Product: ProductSchema,
				CreateProduct: CreateProductSchema,
				UpdateProduct: UpdateProductSchema,
				ProductError: ProductErrorSchema,
			},
			paths: {
				"GET /products": {
					summary: "List products",
					tags: ["Products"],
					operationId: "listProducts",
					query: z.object({
						category: z.string().optional(),
						inStock: z.boolean().optional(),
					}),
					200: ProductSchema,
				},
				"POST /products": {
					summary: "Create product",
					tags: ["Products"],
					operationId: "createProduct",
					body: CreateProductSchema,
					201: ProductSchema,
					400: ProductErrorSchema,
				},
				"GET /products/{id}": {
					summary: "Get product by ID",
					tags: ["Products"],
					operationId: "getProduct",
					200: ProductSchema,
					404: ProductErrorSchema,
				},
				"PUT /products/{id}": {
					summary: "Update product",
					tags: ["Products"],
					operationId: "updateProduct",
					body: UpdateProductSchema,
					200: ProductSchema,
					404: ProductErrorSchema,
				},
				"DELETE /products/{id}": {
					summary: "Delete product",
					tags: ["Products"],
					operationId: "deleteProduct",
					204: null,
					404: ProductErrorSchema,
				},
			},
		});

		// --- Gateway ---
		const gatewayBase = openapi({
			info: {
				title: "E-Commerce Gateway API",
				version: "2.0.0",
				description: "Unified API gateway for the e-commerce platform",
				contact: {
					name: "Platform Team",
					email: "platform@example.com",
				},
			},
			servers: [
				{ url: "https://api.example.com", description: "Production" },
				{
					url: "https://staging-api.example.com",
					description: "Staging",
				},
			],
			security: [{ bearerAuth: [] }],
			paths: {},
		});

		const gatewaySpec = merge(gatewayBase, usersSpec, ordersSpec, productsSpec);

		await assertValidOpenAPI(gatewaySpec);

		// Verify gateway metadata
		expect(gatewaySpec.info.title).toBe("E-Commerce Gateway API");
		expect(gatewaySpec.info.version).toBe("2.0.0");

		// Verify all paths from all services
		expect(gatewaySpec.paths["/users"]?.get).toBeDefined();
		expect(gatewaySpec.paths["/users"]?.post).toBeDefined();
		expect(gatewaySpec.paths["/users/{id}"]?.get).toBeDefined();
		expect(gatewaySpec.paths["/users/{id}"]?.delete).toBeDefined();

		expect(gatewaySpec.paths["/orders"]?.get).toBeDefined();
		expect(gatewaySpec.paths["/orders"]?.post).toBeDefined();
		expect(gatewaySpec.paths["/orders/{id}"]?.get).toBeDefined();
		expect(gatewaySpec.paths["/orders/{id}/cancel"]?.put).toBeDefined();

		expect(gatewaySpec.paths["/products"]?.get).toBeDefined();
		expect(gatewaySpec.paths["/products"]?.post).toBeDefined();
		expect(gatewaySpec.paths["/products/{id}"]?.get).toBeDefined();
		expect(gatewaySpec.paths["/products/{id}"]?.put).toBeDefined();
		expect(gatewaySpec.paths["/products/{id}"]?.delete).toBeDefined();

		// Verify schemas from all services
		expect(gatewaySpec.components?.schemas?.User).toBeDefined();
		expect(gatewaySpec.components?.schemas?.CreateUser).toBeDefined();
		expect(gatewaySpec.components?.schemas?.UserError).toBeDefined();
		expect(gatewaySpec.components?.schemas?.Order).toBeDefined();
		// OrderItem is inlined by Zod inside OrderSchema's JSON Schema output,
		// so it doesn't appear as a separate component even when registered
		expect(gatewaySpec.components?.schemas?.CreateOrder).toBeDefined();
		expect(gatewaySpec.components?.schemas?.OrderError).toBeDefined();
		expect(gatewaySpec.components?.schemas?.Product).toBeDefined();
		expect(gatewaySpec.components?.schemas?.CreateProduct).toBeDefined();
		expect(gatewaySpec.components?.schemas?.UpdateProduct).toBeDefined();
		expect(gatewaySpec.components?.schemas?.ProductError).toBeDefined();

		// Verify security scheme from users service
		expect(gatewaySpec.components?.securitySchemes?.bearerAuth).toBeDefined();

		// Verify tags from all services
		const tagNames = gatewaySpec.tags?.map((t) => t.name);
		expect(tagNames).toContain("Users");
		expect(tagNames).toContain("Orders");
		expect(tagNames).toContain("Products");

		// Verify servers from gateway
		expect(gatewaySpec.servers).toHaveLength(2);
		expect(gatewaySpec.servers![0]!.url).toBe("https://api.example.com");
	});
});

describe("docs/examples/multi-content-type — Report Export", () => {
	const ReportSchema = z.object({
		id: z.string().uuid(),
		title: z.string(),
		generatedAt: z.string().datetime(),
		data: z.array(
			z.object({
				label: z.string(),
				value: z.number(),
			}),
		),
	});

	const CreateReportSchema = z.object({
		title: z.string().min(1),
		startDate: z.string().datetime(),
		endDate: z.string().datetime(),
	});

	const ErrorSchema = z.object({
		message: z.string(),
		code: z.string(),
	});

	it("declarative openapi() with multi-content-type responses", async () => {
		const spec = openapi({
			info: {
				title: "Report Export API",
				version: "1.0.0",
				description: "An API for generating and exporting reports",
			},
			servers: [{ url: "https://api.example.com/v1", description: "Production" }],
			tags: [{ name: "Reports", description: "Report generation and export" }],
			schemas: {
				Report: ReportSchema,
				Error: ErrorSchema,
			},
			paths: {
				"POST /reports": {
					summary: "Create a report",
					tags: ["Reports"],
					operationId: "createReport",
					body: CreateReportSchema,
					201: ReportSchema,
					400: ErrorSchema,
				},
				"GET /reports/{id}": {
					summary: "Get a report",
					tags: ["Reports"],
					operationId: "getReport",
					200: {
						description: "The requested report",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Report" },
							},
							"text/csv": {
								schema: { type: "string" },
							},
						},
					},
					404: ErrorSchema,
				},
				"GET /reports/{id}/export": {
					summary: "Export a report",
					tags: ["Reports"],
					operationId: "exportReport",
					200: {
						description: "The exported report",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Report" },
							},
							"application/pdf": {
								schema: { type: "string", format: "binary" },
							},
						},
					},
					404: ErrorSchema,
				},
			},
		});

		await assertValidOpenAPI(spec);

		// Verify paths exist
		expect(spec.paths["/reports"]?.post).toBeDefined();
		expect(spec.paths["/reports/{id}"]?.get).toBeDefined();
		expect(spec.paths["/reports/{id}/export"]?.get).toBeDefined();

		// Verify multi-content-type on GET /reports/{id}
		const getReportResp = spec.paths["/reports/{id}"]?.get?.responses?.["200"] as any;
		expect(getReportResp.content["application/json"]).toBeDefined();
		expect(getReportResp.content["text/csv"]).toBeDefined();

		// Verify multi-content-type on GET /reports/{id}/export
		const exportResp = spec.paths["/reports/{id}/export"]?.get?.responses?.["200"] as any;
		expect(exportResp.content["application/json"]).toBeDefined();
		expect(exportResp.content["application/pdf"]).toBeDefined();

		// Verify named schemas
		expect(spec.components?.schemas?.Report).toBeDefined();
		expect(spec.components?.schemas?.Error).toBeDefined();
	});

	it("class-based API with multi-content-type responses", async () => {
		const api = new OpenAPI({
			info: {
				title: "Report Export API",
				version: "1.0.0",
				description: "An API for generating and exporting reports",
			},
			servers: [{ url: "https://api.example.com/v1", description: "Production" }],
			tags: [{ name: "Reports", description: "Report generation and export" }],
		});

		api.schema("Report", ReportSchema);
		api.schema("Error", ErrorSchema);

		api.route("post", "/reports", {
			summary: "Create a report",
			tags: ["Reports"],
			operationId: "createReport",
			body: CreateReportSchema,
			201: ReportSchema,
			400: ErrorSchema,
		});

		api.route("get", "/reports/{id}", {
			summary: "Get a report",
			tags: ["Reports"],
			operationId: "getReport",
			200: {
				description: "The requested report",
				content: {
					"application/json": {
						schema: { $ref: "#/components/schemas/Report" },
					},
					"text/csv": {
						schema: { type: "string" },
					},
				},
			},
			404: ErrorSchema,
		});

		api.route("get", "/reports/{id}/export", {
			summary: "Export a report",
			tags: ["Reports"],
			operationId: "exportReport",
			200: {
				description: "The exported report",
				content: {
					"application/json": {
						schema: { $ref: "#/components/schemas/Report" },
					},
					"application/pdf": {
						schema: { type: "string", format: "binary" },
					},
				},
			},
			404: ErrorSchema,
		});

		const spec = api.document();

		await assertValidOpenAPI(spec);

		// Verify paths exist
		expect(spec.paths["/reports"]?.post).toBeDefined();
		expect(spec.paths["/reports/{id}"]?.get).toBeDefined();
		expect(spec.paths["/reports/{id}/export"]?.get).toBeDefined();

		// Verify multi-content-type on GET /reports/{id}
		const getReportResp = spec.paths["/reports/{id}"]?.get?.responses?.["200"] as any;
		expect(getReportResp.content["application/json"]).toBeDefined();
		expect(getReportResp.content["text/csv"]).toBeDefined();

		// Verify multi-content-type on GET /reports/{id}/export
		const exportResp = spec.paths["/reports/{id}/export"]?.get?.responses?.["200"] as any;
		expect(exportResp.content["application/json"]).toBeDefined();
		expect(exportResp.content["application/pdf"]).toBeDefined();

		// Verify named schemas
		expect(spec.components?.schemas?.Report).toBeDefined();
		expect(spec.components?.schemas?.Error).toBeDefined();
	});
});
