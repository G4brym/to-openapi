import type { StandardJSONSchemaV1 } from "@standard-schema/spec";

// ─── HTTP Methods ───────────────────────────────────────────────────────────

export type HttpMethod = "get" | "post" | "put" | "patch" | "delete" | "head" | "options" | "trace";

// ─── OpenAPI Document Types ─────────────────────────────────────────────────

export interface ReferenceObject {
	$ref: string;
}

export type SchemaOrRef = Record<string, unknown> | ReferenceObject;

export interface InfoObject {
	title: string;
	version: string;
	description?: string;
	termsOfService?: string;
	contact?: {
		name?: string;
		url?: string;
		email?: string;
	};
	license?: {
		name: string;
		url?: string;
	};
}

export interface ServerObject {
	url: string;
	description?: string;
	variables?: Record<
		string,
		{
			default: string;
			enum?: string[];
			description?: string;
		}
	>;
}

export interface ExternalDocsObject {
	url: string;
	description?: string;
}

export interface TagObject {
	name: string;
	description?: string;
	externalDocs?: ExternalDocsObject;
}

export interface SecurityRequirementObject {
	[name: string]: string[];
}

export interface SecuritySchemeObject {
	type: "apiKey" | "http" | "oauth2" | "openIdConnect";
	description?: string;
	name?: string;
	in?: "query" | "header" | "cookie";
	scheme?: string;
	bearerFormat?: string;
	flows?: Record<string, unknown>;
	openIdConnectUrl?: string;
}

export interface MediaTypeObject {
	schema?: SchemaOrRef;
	example?: unknown;
	examples?: Record<string, unknown>;
	encoding?: Record<string, unknown>;
}

export interface ParameterObject {
	name: string;
	in: "query" | "header" | "path" | "cookie";
	description?: string;
	required?: boolean;
	deprecated?: boolean;
	schema?: SchemaOrRef;
	style?: string;
	explode?: boolean;
}

export interface RequestBodyObject {
	description?: string;
	content: Record<string, MediaTypeObject>;
	required?: boolean;
}

export interface ResponseObject {
	description: string;
	headers?: Record<string, unknown>;
	content?: Record<string, MediaTypeObject>;
	links?: Record<string, unknown>;
}

export interface OperationObject {
	operationId?: string;
	summary?: string;
	description?: string;
	tags?: string[];
	deprecated?: boolean;
	security?: SecurityRequirementObject[];
	parameters?: ParameterObject[];
	requestBody?: RequestBodyObject;
	responses?: Record<string, ResponseObject | ReferenceObject>;
	externalDocs?: ExternalDocsObject;
}

export interface PathItemObject {
	summary?: string;
	description?: string;
	get?: OperationObject;
	post?: OperationObject;
	put?: OperationObject;
	patch?: OperationObject;
	delete?: OperationObject;
	head?: OperationObject;
	options?: OperationObject;
	trace?: OperationObject;
	parameters?: ParameterObject[];
}

export interface ComponentsObject {
	schemas?: Record<string, SchemaOrRef>;
	securitySchemes?: Record<string, SecuritySchemeObject>;
	responses?: Record<string, ResponseObject>;
	parameters?: Record<string, ParameterObject>;
	requestBodies?: Record<string, RequestBodyObject>;
}

export interface OpenAPIDocument {
	openapi: string;
	info: InfoObject;
	servers?: ServerObject[];
	paths: Record<string, PathItemObject>;
	components?: ComponentsObject;
	security?: SecurityRequirementObject[];
	tags?: TagObject[];
	externalDocs?: ExternalDocsObject;
}

// ─── Schema Context ─────────────────────────────────────────────────────────

export interface SchemaContext {
	name?: string;
	location: "body" | "query" | "path" | "header" | "response" | "component";
}

// ─── Route Definition ───────────────────────────────────────────────────────

export interface RouteShorthand {
	query?: StandardJSONSchemaV1;
	params?: StandardJSONSchemaV1;
	headers?: StandardJSONSchemaV1;
	cookies?: StandardJSONSchemaV1;
	body?: StandardJSONSchemaV1 | RequestBodyObject;
	summary?: string;
	description?: string;
	operationId?: string;
	tags?: string[];
	deprecated?: boolean;
	security?: SecurityRequirementObject[];
	[statusCode: number]: StandardJSONSchemaV1 | ResponseObject | string | null;
}

export interface RouteDefinition extends RouteShorthand {
	method: HttpMethod;
	path: string;
}

// ─── Parsed Route ───────────────────────────────────────────────────────────

export interface ParsedRoute {
	method: HttpMethod;
	path: string;
	pathParams: string[];
}

// ─── Plugin ─────────────────────────────────────────────────────────────────

export interface ToOpenapiPlugin {
	name: string;
	transformRoute?: (route: RouteDefinition) => RouteDefinition;
	transformSchema?: (schema: SchemaOrRef, context: SchemaContext) => SchemaOrRef;
	transformDocument?: (document: OpenAPIDocument) => OpenAPIDocument;
}

// ─── Declarative Definition ─────────────────────────────────────────────────

export interface ToOpenapiDefinition {
	info: InfoObject;
	paths: Record<string, RouteShorthand>;
	schemas?: Record<string, StandardJSONSchemaV1>;
	plugins?: ToOpenapiPlugin[];
	openapi?: "3.0.3" | "3.1.0";
	servers?: ServerObject[];
	security?: SecurityRequirementObject[];
	securitySchemes?: Record<string, SecuritySchemeObject>;
	tags?: TagObject[];
	externalDocs?: ExternalDocsObject;
}

// ─── OpenAPI Class Options ──────────────────────────────────────────────────

export interface OpenAPIOptions {
	info: InfoObject;
	openapi?: "3.0.3" | "3.1.0";
	servers?: ServerObject[];
	security?: SecurityRequirementObject[];
	securitySchemes?: Record<string, SecuritySchemeObject>;
	tags?: TagObject[];
	externalDocs?: ExternalDocsObject;
	plugins?: ToOpenapiPlugin[];
}
