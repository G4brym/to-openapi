import type { StandardJSONSchemaV1 } from "@standard-schema/spec";
import { assembleDocument } from "./assembler.js";
import { extractPathParams, parseRouteKey } from "./paths.js";
import { SchemaResolver } from "./resolver.js";
import { expandRoute } from "./shorthand.js";
import type {
	HttpMethod,
	OpenAPIDocument,
	OperationObject,
	ParsedRoute,
	RouteDefinition,
	ToOpenapiDefinition,
	ToOpenapiPlugin,
} from "./types.js";
import { deepFreeze } from "./utils.js";

export function openapi(definition: ToOpenapiDefinition): OpenAPIDocument {
	const openapiVersion = definition.openapi ?? "3.1.0";
	const resolver = new SchemaResolver({ openapiVersion });
	const plugins = definition.plugins ?? [];

	if (definition.schemas) {
		for (const [name, schema] of Object.entries(definition.schemas)) {
			resolver.registerNamed(name, schema);
		}
	}

	const routes: { method: HttpMethod; path: string; operation: OperationObject }[] = [];

	for (const [key, shorthand] of Object.entries(definition.paths)) {
		const parsed = parseRouteKey(key);

		let routeDef: RouteDefinition = {
			...shorthand,
			method: parsed.method,
			path: parsed.path,
		};

		routeDef = runTransformRoute(plugins, routeDef);

		const finalParsed: ParsedRoute = {
			method: parsed.method,
			path: routeDef.path,
			pathParams: extractPathParams(routeDef.path),
		};

		const operation = expandRoute(finalParsed, routeDef, resolver, plugins);

		routes.push({
			method: finalParsed.method,
			path: routeDef.path,
			operation,
		});
	}

	let doc = assembleDocument(
		{
			info: definition.info,
			openapiVersion,
			servers: definition.servers,
			security: definition.security,
			securitySchemes: definition.securitySchemes,
			tags: definition.tags,
			externalDocs: definition.externalDocs,
		},
		routes,
		resolver,
	);

	doc = runTransformDocument(plugins, doc);

	return deepFreeze(doc) as OpenAPIDocument;
}

function runTransformRoute(plugins: ToOpenapiPlugin[], route: RouteDefinition): RouteDefinition {
	let result = route;
	for (const plugin of plugins) {
		if (plugin.transformRoute) {
			result = plugin.transformRoute(result);
		}
	}
	return result;
}

function runTransformDocument(plugins: ToOpenapiPlugin[], doc: OpenAPIDocument): OpenAPIDocument {
	let result = doc;
	for (const plugin of plugins) {
		if (plugin.transformDocument) {
			result = plugin.transformDocument(result);
		}
	}
	return result;
}
