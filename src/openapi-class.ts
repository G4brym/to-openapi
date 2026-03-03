import type { StandardJSONSchemaV1 } from "@standard-schema/spec";
import { assembleDocument } from "./assembler.js";
import { SchemaResolver } from "./resolver.js";
import { expandRoute } from "./shorthand.js";
import type {
	HttpMethod,
	OpenAPIDocument,
	OpenAPIOptions,
	OperationObject,
	ParsedRoute,
	RouteDefinition,
	RouteShorthand,
	StdspecPlugin,
} from "./types.js";
import { deepFreeze } from "./utils.js";

export class OpenAPI {
	private readonly options: OpenAPIOptions;
	private readonly openapiVersion: "3.0.3" | "3.1.0";
	private readonly resolver: SchemaResolver;
	private readonly plugins: StdspecPlugin[];
	private readonly routes: { method: HttpMethod; path: string; definition: RouteShorthand }[] = [];

	constructor(options: OpenAPIOptions) {
		this.options = options;
		this.openapiVersion = options.openapi ?? "3.1.0";
		this.resolver = new SchemaResolver({ openapiVersion: this.openapiVersion });
		this.plugins = options.plugins ?? [];
	}

	schema(name: string, schema: StandardJSONSchemaV1): this {
		this.resolver.registerNamed(name, schema);
		return this;
	}

	route(method: HttpMethod, path: string, definition: RouteShorthand): this {
		this.routes.push({ method, path: normalizePath(path), definition });
		return this;
	}

	document(): OpenAPIDocument {
		const assembled: { method: HttpMethod; path: string; operation: OperationObject }[] = [];

		for (const route of this.routes) {
			const parsed: ParsedRoute = {
				method: route.method,
				path: route.path,
				pathParams: extractPathParams(route.path),
			};

			let routeDef: RouteDefinition = {
				...route.definition,
				method: route.method,
				path: route.path,
			};

			routeDef = this.runTransformRoute(routeDef);

			const operation = expandRoute(parsed, routeDef, this.resolver);
			assembled.push({ method: route.method, path: route.path, operation });
		}

		let doc = assembleDocument(
			{
				info: this.options.info,
				openapiVersion: this.openapiVersion,
				servers: this.options.servers,
				security: this.options.security,
				securitySchemes: this.options.securitySchemes,
				tags: this.options.tags,
				externalDocs: this.options.externalDocs,
			},
			assembled,
			this.resolver,
		);

		doc = this.runTransformDocument(doc);

		return deepFreeze(doc) as OpenAPIDocument;
	}

	private runTransformRoute(route: RouteDefinition): RouteDefinition {
		let result = route;
		for (const plugin of this.plugins) {
			if (plugin.transformRoute) {
				result = plugin.transformRoute(result);
			}
		}
		return result;
	}

	private runTransformDocument(doc: OpenAPIDocument): OpenAPIDocument {
		let result = doc;
		for (const plugin of this.plugins) {
			if (plugin.transformDocument) {
				result = plugin.transformDocument(result);
			}
		}
		return result;
	}
}

function normalizePath(path: string): string {
	return path.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (_match, param: string) => `{${param}}`);
}

function extractPathParams(path: string): string[] {
	const params: string[] = [];
	const regex = /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g;
	let match: RegExpExecArray | null;
	while ((match = regex.exec(path)) !== null) {
		params.push(match[1]!);
	}
	return params;
}
