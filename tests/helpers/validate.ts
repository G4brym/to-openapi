import { Validator } from "@seriousme/openapi-schema-validator";

const validator = new Validator();

export async function assertValidOpenAPI(doc: unknown): Promise<void> {
	const result = await validator.validate(doc);
	if (!result.valid) {
		throw new Error(`Invalid OpenAPI document:\n${JSON.stringify(result.errors, null, 2)}`);
	}
}
