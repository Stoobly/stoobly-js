const {pathsToModuleNameMapper} = require('ts-jest');
const {compilerOptions} = require('./tsconfig');

module.exports = {
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: '<rootDir>',
  }),
  modulePaths: ['<rootDir>'],
  preset: 'ts-jest',
  setupFiles: ['./setup.jest.js'],
  testEnvironment: 'jsdom',
  testMatch: ['**/test/**/*.[jt]s?(x)'],
};
