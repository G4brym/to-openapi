import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/index.ts", "src/plugins/*.ts"],
	format: ["esm", "cjs"],
	dts: true,
	splitting: true,
	clean: true,
});
