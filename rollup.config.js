import { terser } from "rollup-plugin-terser";
import pkg from "./package.json";

/** @type {import("rollup").RollupOptions} */
const options = {
  // Use the ESM entrypoint script as the bundle input
  input: pkg.exports.import,
  output: [
    {
      file: `dist/${pkg.name}.umd.cjs`,
      format: "umd",
      name: pkg.name,
      plugins: [
        terser({
          mangle: {
            // Preserve exception class names
            keep_classnames: true,
          },
        }),
      ],
      sourcemap: true,
    },
    {
      // For Node.js 10.x, which does not recognize the '*.cjs' extension when
      // using '--experimental-modules'
      file: `dist/${pkg.name}.umd.js`,
      format: "umd",
      name: pkg.name,
      plugins: [
        terser({
          mangle: {
            // Preserve exception class names
            keep_classnames: true,
          },
        }),
      ],
      sourcemap: true,
    },
    {
      file: `dist/${pkg.name}.esm.js`,
      format: "esm",
      plugins: [
        terser({
          mangle: {
            // Preserve exception class names
            keep_classnames: true,
          },
        }),
      ],
      sourcemap: true,
    },
  ],
};

export default options;
