/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/configuration
 */

export default {
  clearMocks: true,
  roots: ["<rootDir>/src"],
  automock: false,
  preset: "jest-mysql",
  transform: {
    "^.+\\.(ts)?$": "ts-jest",
  },
};
