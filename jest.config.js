const {pathsToModuleNameMapper} = require('ts-jest');
const {compilerOptions} = require('./tsconfig');
const os = require('os');

// Jest 30 calls os.availableParallelism(), which requires Node >= 18.14.
const cpuCount =
  typeof os.availableParallelism === 'function'
    ? os.availableParallelism()
    : os.cpus().length;

module.exports = {
  maxWorkers: Math.max(cpuCount - 1, 1),
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: '<rootDir>',
  }),
  modulePaths: ['<rootDir>'],
  preset: 'ts-jest',
  setupFiles: ['./setup.jest.js'],
  testEnvironment: 'jsdom',
  testMatch: ['**/__tests__/**/*.[jt]s?(x)'],
};
