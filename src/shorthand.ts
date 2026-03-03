import type { StandardJSONSchemaV1 } from "@standard-schema/spec";
import { STATUS_DESCRIPTIONS, generateOperationId } from "./defaults.js";
import type { SchemaResolver } from "./resolver.js";
import type {
	OperationObject,
	ParameterObject,
	ParsedRoute,
	RequestBodyObject,
	ResponseObject,
	RouteShorthand,
	SchemaOrRef,
} from "./types.js";
import { isFullRequestBodyObject, isFullResponseObject, isStandardJSONSchema } from "./utils.js";

export function expandRoute(
	parsed: ParsedRoute,
	definition: RouteShorthand,
	resolver: SchemaResolver,
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

	if (parameters.length > 0) {
		operation.parameters = parameters;
	}

	if (definition.body !== undefined) {
		operation.requestBody = expandBody(definition.body, resolver);
	}

	const responses = expandResponses(definition, resolver);
	if (Object.keys(responses).length > 0) {
		operation.responses = responses;
	}

	if (definition.summary) operation.summary = definition.summary;
	if (definition.description) operation.description = definition.description;
	if (definition.tags) operation.tags = definition.tags;
	if (definition.deprecated) operation.deprecated = definition.deprecated;
	if (definition.security) operation.security = definition.security;

	operation.operationId =
		definition.operationId ?? generateOperationId(parsed.method, parsed.path);

	return operation;
}

function expandQueryParams(
	schema: StandardJSONSchemaV1,
	parameters: ParameterObject[],
	resolver: SchemaResolver,
): void {
	const resolved = resolver.resolve(schema) as Record<string, unknown>;
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
		parameters.push(param);
	}
}

function expandPathParams(
	schema: StandardJSONSchemaV1,
	pathParams: string[],
	parameters: ParameterObject[],
	resolver: SchemaResolver,
): void {
	const resolved = resolver.resolve(schema) as Record<string, unknown>;
	const properties = resolved.properties as Record<string, unknown> | undefined;
	const definedParams = new Set<string>();

	if (properties) {
		for (const [name, propSchema] of Object.entries(properties)) {
			parameters.push({
				name,
				in: "path",
				required: true,
				schema: propSchema as SchemaOrRef,
			});
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
	const resolved = resolver.resolve(schema) as Record<string, unknown>;
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
		parameters.push(param);
	}
}

function expandBody(
	body: StandardJSONSchemaV1 | RequestBodyObject,
	resolver: SchemaResolver,
): RequestBodyObject {
	if (isFullRequestBodyObject(body)) {
		return body as RequestBodyObject;
	}

	const schema = resolver.resolve(body as StandardJSONSchemaV1);
	return {
		content: {
			"application/json": { schema },
		},
	};
}

function expandResponses(
	definition: RouteShorthand,
	resolver: SchemaResolver,
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
			const ref = resolver.resolve(value);
			responses[String(statusCode)] = {
				description,
				content: {
					"application/json": { schema: ref },
				},
			};
			continue;
		}

		if (isFullResponseObject(value)) {
			responses[String(statusCode)] = value as ResponseObject;
			continue;
		}

		if (isStandardJSONSchema(value)) {
			const schema = resolver.resolve(value as StandardJSONSchemaV1);
			responses[String(statusCode)] = {
				description,
				content: {
					"application/json": { schema },
				},
			};
			continue;
		}
	}

	return responses;
}
