import { terser } from "rollup-plugin-terser";
import pkg from "./package.json";

/**
 * Shared options for all output bundles
 * @type {import("rollup").OutputOptions}
 */
const outputOptionsBase = {
  name: pkg.name, // For UMD bundles
  plugins: [
    terser({
      mangle: {
        // Preserve exception class names
        keep_classnames: true,
      },
    }),
  ],
  sourcemap: true,
};

/** @type {import("rollup").RollupOptions} */
const options = {
  // Use the ESM entrypoint script as the bundle input
  input: pkg.exports.import,
  output: [
    Object.assign({}, outputOptionsBase, {
      file: `dist/${pkg.name}.umd.cjs`,
      format: "umd",
    }),
    Object.assign({}, outputOptionsBase, {
      // For Node.js 10.x, which does not recognize the '*.cjs' extension when
      // using '--experimental-modules'
      file: `dist/${pkg.name}.umd.js`,
      format: "umd",
    }),
    Object.assign({}, outputOptionsBase, {
      file: `dist/${pkg.name}.esm.js`,
      format: "esm",
    }),
  ],
};

export default options;
