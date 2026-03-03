import type { StandardJSONSchemaV1 } from "@standard-schema/spec";
import { StdspecError } from "./errors.js";
import type { ReferenceObject, SchemaOrRef } from "./types.js";

export class SchemaResolver {
	private readonly openapiVersion: "3.0.3" | "3.1.0";
	private readonly namedSchemas = new Map<string, StandardJSONSchemaV1>();
	private readonly schemaIdentity = new WeakMap<StandardJSONSchemaV1, string>();
	private readonly resolvedCache = new WeakMap<StandardJSONSchemaV1, Record<string, unknown>>();
	private readonly usageCount = new WeakMap<StandardJSONSchemaV1, number>();
	private readonly componentSchemas = new Map<string, Record<string, unknown>>();
	private autoNameCounter = 0;

	constructor(options: { openapiVersion: "3.0.3" | "3.1.0" }) {
		this.openapiVersion = options.openapiVersion;
	}

	registerNamed(name: string, schema: StandardJSONSchemaV1): void {
		this.namedSchemas.set(name, schema);
		this.schemaIdentity.set(schema, name);
	}

	resolve(schemaOrName: StandardJSONSchemaV1 | string): SchemaOrRef {
		if (typeof schemaOrName === "string") {
			if (!this.namedSchemas.has(schemaOrName)) {
				throw new StdspecError(
					"SCHEMA_RESOLUTION_FAILED",
					`Named schema "${schemaOrName}" not found`,
				);
			}
			this.ensureComponentResolved(schemaOrName);
			return { $ref: `#/components/schemas/${schemaOrName}` };
		}

		const schema = schemaOrName;

		const existingName = this.schemaIdentity.get(schema);
		if (existingName) {
			this.ensureComponentResolved(existingName);
			return { $ref: `#/components/schemas/${existingName}` };
		}

		const count = (this.usageCount.get(schema) ?? 0) + 1;
		this.usageCount.set(schema, count);

		if (count >= 2) {
			let name = this.autoName(schema);
			while (this.namedSchemas.has(name) && this.namedSchemas.get(name) !== schema) {
				name = `${name}_${this.autoNameCounter++}`;
			}
			this.schemaIdentity.set(schema, name);
			this.namedSchemas.set(name, schema);
			this.ensureComponentResolved(name);
			return { $ref: `#/components/schemas/${name}` };
		}

		return this.resolveSchema(schema);
	}

	resolveInline(schema: StandardJSONSchemaV1): Record<string, unknown> {
		return this.resolveSchema(schema);
	}

	getComponents(): Record<string, SchemaOrRef> {
		return Object.fromEntries(this.componentSchemas);
	}

	private ensureComponentResolved(name: string): void {
		if (this.componentSchemas.has(name)) {
			return;
		}
		const schema = this.namedSchemas.get(name);
		if (!schema) {
			return;
		}
		const resolved = this.resolveSchema(schema);
		this.componentSchemas.set(name, resolved as Record<string, unknown>);
	}

	private resolveSchema(schema: StandardJSONSchemaV1): Record<string, unknown> {
		const cached = this.resolvedCache.get(schema);
		if (cached) {
			return cached;
		}

		const target = this.openapiVersion === "3.0.3" ? "openapi-3.0" : "draft-2020-12";

		try {
			const result = schema["~standard"].jsonSchema.input({ target });
			this.resolvedCache.set(schema, result);
			return result;
		} catch (err) {
			throw new StdspecError(
				"SCHEMA_RESOLUTION_FAILED",
				`Failed to resolve schema: ${err instanceof Error ? err.message : String(err)}`,
			);
		}
	}

	private autoName(schema: StandardJSONSchemaV1): string {
		const vendor = schema["~standard"].vendor;
		if (vendor && vendor !== "mock") {
			const vendorName = vendor.replace(/[^a-zA-Z0-9]/g, "_");
			const candidate = `${vendorName}_Schema_${this.autoNameCounter}`;
			if (!this.namedSchemas.has(candidate)) {
				this.autoNameCounter++;
				return candidate;
			}
			this.autoNameCounter++;
		}

		return `Schema_${this.hash(schema)}`;
	}

	private hash(schema: StandardJSONSchemaV1): string {
		const resolved = this.resolveSchema(schema);
		const str = JSON.stringify(resolved);
		let h = 0;
		for (let i = 0; i < str.length; i++) {
			h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
		}
		return (h >>> 0).toString(16).padStart(8, "0");
	}
}
