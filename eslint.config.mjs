import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

const error = "error";

export default [
  "eslint:recommended",
  {
    files: [ "**/*.ts" ],
    languageOptions: {
      parser: tsParser,
      globals: globals.node,
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      "no-console": error,
      "complexity": [error, { max: 5 }],
      "max-depth": [error, { max: 2 }],
      "max-nested-callbacks": [error, { max: 2 }],
      "max-params": [error, { max: 3 }],
      "max-statements": [error, { max: 12 }, { ignoreTopLevelFunctions: false }],
      "max-len": [error, { code: 120, ignoreUrls: true }],
      "max-lines": [error, { max: 150, skipComments: true, skipBlankLines: true }],
      "semi": [error, "always"],
      "no-multiple-empty-lines": [error, { max: 1 }],
      "space-before-function-paren": [error, { anonymous: "always", named: "never", asyncArrow: "always" }],
      "@typescript-eslint/no-unused-vars": error,
      "no-undef": 0,
    }
  },
  {
    files: [ "test/**/*.ts" ],
    languageOptions: {
      globals: globals.mocha,
    },
  },
];
