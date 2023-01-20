module.exports = {
	"env": {
		"browser": true,
		"es2021": true
	},
	"ignorePatterns":[".eslintrc.js"],
	"extends": [
		"eslint:recommended",
		"plugin:@typescript-eslint/recommended",
		"prettier"
	],
	"overrides": [
	],
	"parser": "@typescript-eslint/parser",
	"parserOptions": {
		"ecmaVersion": "latest",
		"sourceType": "module",
"project": "./tsconfig.json",
		"tsconfigRootDir": __dirname
	},
	"plugins": [
		"@typescript-eslint",
	],
	"rules": {
		"indent": [
			"error",
			"tab"
		],
		"linebreak-style": [
			"error",
			"unix"
		],
		"quotes": [
			"error",
			"double"
		],
		"semi": [
			"error",
			"always"
		]
	}
};
