import type {
	OpenAPIDocument,
	RouteDefinition,
	SchemaContext,
	SchemaOrRef,
	ToOpenapiPlugin,
} from "./types.js";

export function runTransformRoute(
	plugins: ToOpenapiPlugin[],
	route: RouteDefinition,
): RouteDefinition {
	let result = route;
	for (const plugin of plugins) {
		if (plugin.transformRoute) {
			result = plugin.transformRoute(result);
		}
	}
	return result;
}

export function runTransformDocument(
	plugins: ToOpenapiPlugin[],
	doc: OpenAPIDocument,
): OpenAPIDocument {
	let result = doc;
	for (const plugin of plugins) {
		if (plugin.transformDocument) {
			result = plugin.transformDocument(result);
		}
	}
	return result;
}

export function runTransformSchema(
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
