/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/configuration
 */

export default {
  roots: ['<rootDir>/src'],
  automock: false,
  transform: {
    '^.+\\.(ts)?$': 'ts-jest',
  },
  testRegex: './*.spec|e2e|test.(ts)?$',
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
};
