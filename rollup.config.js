import { terser } from "rollup-plugin-terser";
import pkg from "./package.json";

export default {
  // Use the ESM entrypoint script as the bundle input
  input: pkg.exports.import,
  output: [
    {
      file: `dist/${pkg.name}.umd.cjs`,
      format: "umd",
      name: pkg.name,
      plugins: terser({
        mangle: {
          // Preserve exception class names
          keep_classnames: true,
        },
      }),
      sourcemap: true,
    },
    {
      file: `dist/${pkg.name}.esm.js`,
      format: "esm",
      plugins: terser({
        mangle: {
          // Preserve exception class names
          keep_classnames: true,
        },
      }),
      sourcemap: true,
    },
  ],
};
