import type { StandardJSONSchemaV1 } from "@standard-schema/spec";
import { STATUS_DESCRIPTIONS, generateOperationId } from "./defaults.js";
import type { SchemaResolver } from "./resolver.js";
import type {
	BodyShorthandObject,
	MediaTypeObject,
	OperationObject,
	ParameterObject,
	ParsedRoute,
	RequestBodyObject,
	ResponseObject,
	ResponseShorthandObject,
	RouteShorthand,
	SchemaContext,
	SchemaOrRef,
	ToOpenapiPlugin,
} from "./types.js";
import {
	isBodyShorthandObject,
	isFullRequestBodyObject,
	isFullResponseObject,
	isResponseShorthandObject,
	isStandardJSONSchema,
} from "./utils.js";

function runTransformSchema(
	plugins: ToOpenapiPlugin[],
	schema: SchemaOrRef,
	context: SchemaContext,
): SchemaOrRef {
	let result = schema;
	for (const plugin of plugins) {
		if (plugin.transformSchema) {
			result = plugin.transformSchema(result, context);
		}
	}
	return result;
}

export function expandRoute(
	parsed: ParsedRoute,
	definition: RouteShorthand,
	resolver: SchemaResolver,
	plugins: ToOpenapiPlugin[] = [],
): OperationObject {
	const operation: OperationObject = {};
	const parameters: ParameterObject[] = [];

	if (definition.query) {
		expandQueryParams(definition.query, parameters, resolver);
	}

	if (definition.params) {
		expandPathParams(definition.params, parsed.pathParams, parameters, resolver);
	} else {
		addAutoPathParams(parsed.pathParams, parameters);
	}

	if (definition.headers) {
		expandHeaderParams(definition.headers, parameters, resolver);
	}

	if (definition.cookies) {
		expandCookieParams(definition.cookies, parameters, resolver);
	}

	if (parameters.length > 0) {
		operation.parameters = parameters;
	}

	if (definition.body !== undefined) {
		operation.requestBody = expandBody(definition.body, resolver, plugins);
	}

	const responses = expandResponses(definition, resolver, plugins);
	if (Object.keys(responses).length > 0) {
		operation.responses = responses;
	}

	if (definition.summary) operation.summary = definition.summary;
	if (definition.description) operation.description = definition.description;
	if (definition.tags) operation.tags = definition.tags;
	if (definition.deprecated) operation.deprecated = definition.deprecated;
	if (definition.security) operation.security = definition.security;

	operation.operationId = definition.operationId ?? generateOperationId(parsed.method, parsed.path);

	return operation;
}

function expandQueryParams(
	schema: StandardJSONSchemaV1,
	parameters: ParameterObject[],
	resolver: SchemaResolver,
): void {
	const resolved = resolver.resolveInline(schema);
	const properties = resolved.properties as Record<string, unknown> | undefined;
	if (!properties) return;

	const required = new Set((resolved.required as string[] | undefined) ?? []);

	for (const [name, propSchema] of Object.entries(properties)) {
		const param: ParameterObject = {
			name,
			in: "query",
			schema: propSchema as SchemaOrRef,
		};
		if (required.has(name)) {
			param.required = true;
		}
		if ((propSchema as Record<string, unknown>).deprecated === true) {
			param.deprecated = true;
		}
		parameters.push(param);
	}
}

function expandPathParams(
	schema: StandardJSONSchemaV1,
	pathParams: string[],
	parameters: ParameterObject[],
	resolver: SchemaResolver,
): void {
	const resolved = resolver.resolveInline(schema);
	const properties = resolved.properties as Record<string, unknown> | undefined;
	const definedParams = new Set<string>();

	if (properties) {
		for (const [name, propSchema] of Object.entries(properties)) {
			const param: ParameterObject = {
				name,
				in: "path",
				required: true,
				schema: propSchema as SchemaOrRef,
			};
			if ((propSchema as Record<string, unknown>).deprecated === true) {
				param.deprecated = true;
			}
			parameters.push(param);
			definedParams.add(name);
		}
	}

	for (const param of pathParams) {
		if (!definedParams.has(param)) {
			parameters.push({
				name: param,
				in: "path",
				required: true,
				schema: { type: "string" },
			});
		}
	}
}

function addAutoPathParams(pathParams: string[], parameters: ParameterObject[]): void {
	for (const param of pathParams) {
		parameters.push({
			name: param,
			in: "path",
			required: true,
			schema: { type: "string" },
		});
	}
}

function expandHeaderParams(
	schema: StandardJSONSchemaV1,
	parameters: ParameterObject[],
	resolver: SchemaResolver,
): void {
	const resolved = resolver.resolveInline(schema);
	const properties = resolved.properties as Record<string, unknown> | undefined;
	if (!properties) return;

	const required = new Set((resolved.required as string[] | undefined) ?? []);

	for (const [name, propSchema] of Object.entries(properties)) {
		const param: ParameterObject = {
			name,
			in: "header",
			schema: propSchema as SchemaOrRef,
		};
		if (required.has(name)) {
			param.required = true;
		}
		if ((propSchema as Record<string, unknown>).deprecated === true) {
			param.deprecated = true;
		}
		parameters.push(param);
	}
}

function expandCookieParams(
	schema: StandardJSONSchemaV1,
	parameters: ParameterObject[],
	resolver: SchemaResolver,
): void {
	const resolved = resolver.resolveInline(schema);
	const properties = resolved.properties as Record<string, unknown> | undefined;
	if (!properties) return;

	const required = new Set((resolved.required as string[] | undefined) ?? []);

	for (const [name, propSchema] of Object.entries(properties)) {
		const param: ParameterObject = {
			name,
			in: "cookie",
			schema: propSchema as SchemaOrRef,
		};
		if (required.has(name)) {
			param.required = true;
		}
		if ((propSchema as Record<string, unknown>).deprecated === true) {
			param.deprecated = true;
		}
		parameters.push(param);
	}
}

function inferSchema(contentType: string): SchemaOrRef | undefined {
	if (contentType.startsWith("text/")) return { type: "string" };
	if (contentType === "application/octet-stream") return { type: "string", format: "binary" };
	return undefined;
}

function expandBody(
	body: StandardJSONSchemaV1 | RequestBodyObject | BodyShorthandObject,
	resolver: SchemaResolver,
	plugins: ToOpenapiPlugin[],
): RequestBodyObject {
	if (isFullRequestBodyObject(body)) {
		return body as RequestBodyObject;
	}

	if (isBodyShorthandObject(body)) {
		const shorthand = body as BodyShorthandObject;
		const contentType = shorthand.contentType ?? "application/json";
		let schema: SchemaOrRef;
		if (shorthand.schema) {
			schema = resolver.resolve(shorthand.schema);
			schema = runTransformSchema(plugins, schema, { location: "body" });
		} else {
			schema = inferSchema(contentType) ?? { type: "object" };
		}
		const mediaType: MediaTypeObject = { schema };
		if (shorthand.example !== undefined) mediaType.example = shorthand.example;
		if (shorthand.examples) mediaType.examples = shorthand.examples;
		const result: RequestBodyObject = { content: { [contentType]: mediaType } };
		if (shorthand.description) result.description = shorthand.description;
		if (shorthand.required !== undefined) result.required = shorthand.required;
		return result;
	}

	let schema = resolver.resolve(body as StandardJSONSchemaV1);
	schema = runTransformSchema(plugins, schema, { location: "body" });
	return {
		content: {
			"application/json": { schema },
		},
	};
}

function expandResponses(
	definition: RouteShorthand,
	resolver: SchemaResolver,
	plugins: ToOpenapiPlugin[],
): Record<string, ResponseObject> {
	const responses: Record<string, ResponseObject> = {};

	for (const key of Object.keys(definition)) {
		const statusCode = Number(key);
		if (!Number.isInteger(statusCode) || statusCode < 100 || statusCode > 599) {
			continue;
		}

		const value = (definition as Record<string, unknown>)[key];
		const description = STATUS_DESCRIPTIONS[statusCode] ?? `Response ${statusCode}`;

		if (value === null) {
			responses[String(statusCode)] = { description };
			continue;
		}

		if (typeof value === "string") {
			let ref = resolver.resolve(value);
			ref = runTransformSchema(plugins, ref, { location: "response" });
			responses[String(statusCode)] = {
				description,
				content: {
					"application/json": { schema: ref },
				},
			};
			continue;
		}

		if (isResponseShorthandObject(value)) {
			const shorthand = value as ResponseShorthandObject;
			const contentType = shorthand.contentType ?? "application/json";
			let schema: SchemaOrRef;
			if (shorthand.schema) {
				const resolved = typeof shorthand.schema === "string"
					? resolver.resolve(shorthand.schema)
					: resolver.resolve(shorthand.schema);
				schema = runTransformSchema(plugins, resolved, { location: "response" });
			} else {
				schema = inferSchema(contentType) ?? { type: "object" };
			}
			const mediaType: MediaTypeObject = { schema };
			if (shorthand.example !== undefined) mediaType.example = shorthand.example;
			if (shorthand.examples) mediaType.examples = shorthand.examples;
			const response: ResponseObject = {
				description: shorthand.description ?? description,
				content: { [contentType]: mediaType },
			};
			if (shorthand.headers) response.headers = shorthand.headers;
			responses[String(statusCode)] = response;
			continue;
		}

		if (isFullResponseObject(value)) {
			responses[String(statusCode)] = value as ResponseObject;
			continue;
		}

		if (isStandardJSONSchema(value)) {
			let schema = resolver.resolve(value as StandardJSONSchemaV1);
			schema = runTransformSchema(plugins, schema, { location: "response" });
			responses[String(statusCode)] = {
				description,
				content: {
					"application/json": { schema },
				},
			};
		}
	}

	return responses;
}
