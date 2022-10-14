import json from "@rollup/plugin-json";
import replace from "@rollup/plugin-replace";
import typescript from "@rollup/plugin-typescript";
import { Plugin, RollupOptions } from "rollup";

type apiOrCliType = "api" | "cli";

function createPlugins(dev: boolean, apiOrCli: apiOrCliType): Plugin[] {
  return [
    typescript({
      tsconfig: "./tsconfig.rollup.json",
      compilerOptions: {
        removeComments: !dev,
      },
    }),
    replace({
      preventAssignment: true,
      values: {
        "process.env.IMG_PROJECT_ENV": JSON.stringify(
          dev ? "development" : "production"
        ),
        "process.env.IMG_PROJECT_RUN_TYPE": JSON.stringify(apiOrCli),
      },
    }),
    json({ preferConst: true }),
  ];
}

interface CreateConfigOptions {
  api?: boolean;
  cli?: boolean;
  dev: boolean;
  format: "cjs" | "esm";
}

function createConfig(
  options: CreateConfigOptions & { cli: true; api: true }
): undefined;
function createConfig(
  options: CreateConfigOptions & { cli: true }
): RollupOptions;
function createConfig(
  options: CreateConfigOptions & { api: true }
): RollupOptions;
function createConfig(options: CreateConfigOptions): undefined;
function createConfig({
  api,
  cli,
  dev,
  format,
}: CreateConfigOptions): RollupOptions | undefined {
  if (api && cli) {
    return undefined;
  } else if (api) {
    return {
      external: [/^node:/g],
      input: "./src/api/entrypoint.ts",
      treeshake: "smallest",
      output: {
        sourcemap: true,
        format,
        file: `./dist/api.${dev ? "dev" : "prod"}.${
          format === "cjs" ? "js" : "mjs"
        }`,
      },
      plugins: createPlugins(dev, "api"),
    };
  } else if (cli) {
    return {
      external: [/^node:/g],
      input: "./src/cli/entrypoint.ts",
      treeshake: "smallest",
      output: {
        sourcemap: true,
        format,
        file: `./dist/cli.${dev ? "dev" : "prod"}.${
          format === "cjs" ? "js" : "mjs"
        }`,
      },
      plugins: createPlugins(dev, "cli"),
    };
  }

  return undefined;
}

const config: RollupOptions[] = [
  createConfig({ cli: true, dev: true, format: "cjs" }),
  createConfig({ cli: true, dev: false, format: "cjs" }),
];

export default config;
