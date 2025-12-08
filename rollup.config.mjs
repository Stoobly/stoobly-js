import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import dts from 'rollup-plugin-dts';

const external = ['axios', 'qs'];

export default [
  // Main ESM build
  {
    input: 'src/stoobly.ts',
    output: {
      file: 'dist/esm/stoobly.js',
      format: 'esm',
      sourcemap: true,
    },
    external,
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        declaration: false,
        declarationMap: false,
        outDir: 'dist/esm',
      }),
    ],
  },
  // Main CJS build
  {
    input: 'src/stoobly.ts',
    output: {
      file: 'dist/cjs/stoobly.js',
      format: 'cjs',
      sourcemap: true,
    },
    external,
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        declaration: false,
        declarationMap: false,
        outDir: 'dist/cjs',
      }),
    ],
  },
  // Constants ESM build
  {
    input: 'src/constants/index.ts',
    output: {
      file: 'dist/esm/constants.js',
      format: 'esm',
      sourcemap: true,
    },
    external,
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        declaration: false,
        declarationMap: false,
        outDir: 'dist/esm',
      }),
    ],
  },
  // Constants CJS build
  {
    input: 'src/constants/index.ts',
    output: {
      file: 'dist/cjs/constants.js',
      format: 'cjs',
      sourcemap: true,
    },
    external,
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        declaration: false,
        declarationMap: false,
        outDir: 'dist/cjs',
      }),
    ],
  },
  // Types ESM build
  {
    input: 'src/types/index.ts',
    output: {
      file: 'dist/esm/types.js',
      format: 'esm',
      sourcemap: true,
    },
    external,
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        declaration: false,
        declarationMap: false,
        outDir: 'dist/esm',
      }),
    ],
  },
  // Types CJS build
  {
    input: 'src/types/index.ts',
    output: {
      file: 'dist/cjs/types.js',
      format: 'cjs',
      sourcemap: true,
    },
    external,
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        declaration: false,
        declarationMap: false,
        outDir: 'dist/cjs',
      }),
    ],
  },
  // Main TypeScript declarations
  {
    input: 'src/stoobly.ts',
    output: {
      file: 'dist/types/stoobly.d.ts',
      format: 'esm',
    },
    external,
    plugins: [dts()],
  },
  // Constants TypeScript declarations
  {
    input: 'src/constants/index.ts',
    output: {
      file: 'dist/types/constants.d.ts',
      format: 'esm',
    },
    external,
    plugins: [dts()],
  },
  // Types TypeScript declarations
  {
    input: 'src/types/index.ts',
    output: {
      file: 'dist/types/types.d.ts',
      format: 'esm',
    },
    external,
    plugins: [dts()],
  },
];

