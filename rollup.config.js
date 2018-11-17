import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import autoExternal from 'rollup-plugin-auto-external';

export default {
  input: 'index.js',
  output: {
    file: 'rucola.bundle.js',
    format: 'cjs',
  },
  plugins: [
    autoExternal(),
    resolve(),
    babel({
      exclude: 'node_modules/**',
    }),
    commonjs(),
  ],
};
