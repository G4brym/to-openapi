import { ToOpenapiError } from "./errors.js";
import type { ComponentsObject, OpenAPIDocument, PathItemObject, TagObject } from "./types.js";

export function merge(base: OpenAPIDocument, ...sources: OpenAPIDocument[]): OpenAPIDocument {
	const paths: Record<string, PathItemObject> = { ...base.paths };
	const componentSchemas: Record<string, unknown> = {
		...(base.components?.schemas ?? {}),
	};
	const securitySchemes: Record<string, unknown> = {
		...(base.components?.securitySchemes ?? {}),
	};
	const tagsByName = new Map<string, TagObject>();

	if (base.tags) {
		for (const tag of base.tags) {
			tagsByName.set(tag.name, tag);
		}
	}

	for (const source of sources) {
		for (const [pathKey, pathItem] of Object.entries(source.paths)) {
			if (!paths[pathKey]) {
				paths[pathKey] = { ...pathItem };
				continue;
			}

			// biome-ignore lint/style/noNonNullAssertion: pathKey is guaranteed to exist from the check above
			const existing = paths[pathKey]!;
			const methods = [
				"get",
				"post",
				"put",
				"patch",
				"delete",
				"head",
				"options",
				"trace",
			] as const;
			for (const method of methods) {
				if (pathItem[method]) {
					if (existing[method]) {
						throw new ToOpenapiError(
							"DUPLICATE_PATH",
							`Duplicate operation: ${method.toUpperCase()} ${pathKey}`,
						);
					}
					(existing as Record<string, unknown>)[method] = pathItem[method];
				}
			}
		}

		if (source.components?.schemas) {
			for (const [name, schema] of Object.entries(source.components.schemas)) {
				if (componentSchemas[name]) {
					throw new ToOpenapiError("DUPLICATE_SCHEMA", `Duplicate component schema: "${name}"`);
				}
				componentSchemas[name] = schema;
			}
		}

		if (source.components?.securitySchemes) {
			for (const [name, scheme] of Object.entries(source.components.securitySchemes)) {
				if (securitySchemes[name]) {
					throw new ToOpenapiError("DUPLICATE_SCHEMA", `Duplicate security scheme: "${name}"`);
				}
				securitySchemes[name] = scheme;
			}
		}

		if (source.tags) {
			for (const tag of source.tags) {
				const existing = tagsByName.get(tag.name);
				if (existing) {
					tagsByName.set(tag.name, { ...tag, ...existing });
				} else {
					tagsByName.set(tag.name, tag);
				}
			}
		}
	}

	const components: ComponentsObject = {};
	if (Object.keys(componentSchemas).length > 0) {
		components.schemas = componentSchemas as Record<string, Record<string, unknown>>;
	}
	if (Object.keys(securitySchemes).length > 0) {
		components.securitySchemes = securitySchemes as ComponentsObject["securitySchemes"];
	}

	const webhooks: Record<string, PathItemObject> = { ...(base.webhooks ?? {}) };

	for (const source of sources) {
		if (source.webhooks) {
			if (base.openapi.startsWith("3.0")) {
				throw new ToOpenapiError(
					"INVALID_DEFINITION",
					"Cannot merge webhooks into an OpenAPI 3.0.x document; webhooks require OpenAPI 3.1.0",
				);
			}
			for (const [name, pathItem] of Object.entries(source.webhooks)) {
				if (!webhooks[name]) {
					webhooks[name] = { ...pathItem };
					continue;
				}

				// biome-ignore lint/style/noNonNullAssertion: name is guaranteed to exist from the check above
				const existing = webhooks[name]!;
				const methods = [
					"get",
					"post",
					"put",
					"patch",
					"delete",
					"head",
					"options",
					"trace",
				] as const;
				for (const method of methods) {
					if (pathItem[method]) {
						if (existing[method]) {
							throw new ToOpenapiError(
								"DUPLICATE_PATH",
								`Duplicate webhook operation: ${method.toUpperCase()} ${name}`,
							);
						}
						(existing as Record<string, unknown>)[method] = pathItem[method];
					}
				}
			}
		}
	}

	const tags = tagsByName.size > 0 ? Array.from(tagsByName.values()) : undefined;

	const doc: OpenAPIDocument = {
		openapi: base.openapi,
		info: base.info,
		paths,
	};

	if (Object.keys(components).length > 0) {
		doc.components = components;
	}

	if (base.servers) {
		doc.servers = base.servers;
	} else {
		for (const source of sources) {
			if (source.servers) {
				doc.servers = source.servers;
				break;
			}
		}
	}

	if (base.security) {
		doc.security = base.security;
	} else {
		for (const source of sources) {
			if (source.security) {
				doc.security = source.security;
				break;
			}
		}
	}

	if (tags) {
		doc.tags = tags;
	}

	if (base.externalDocs) {
		doc.externalDocs = base.externalDocs;
	}

	if (Object.keys(webhooks).length > 0) {
		doc.webhooks = webhooks;
	}

	return doc;
}
