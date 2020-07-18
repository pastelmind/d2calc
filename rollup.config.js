import { terser } from "rollup-plugin-terser";
import pkg from "./package.json";

export default {
  input: pkg.main,
  output: [
    {
      file: `dist/${pkg.name}.umd.js`,
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
