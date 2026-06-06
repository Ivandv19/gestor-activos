/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
	testEnvironment: "node",
	resetMocks: true,
	resetModules: true,
	testMatch: ["**/tests/**/*.test.ts"],
	setupFiles: ["./tests/setup.js"],
	transform: {
		"^.+\\.ts$": [
			"ts-jest",
			{
				useESM: false,
				diagnostics: {
					exclude: ["**/tests/**"],
				},
			},
		],
	},
	moduleFileExtensions: ["ts", "js", "json"],
	moduleNameMapper: {
		"^(\\.{1,2}/.*)\\.js$": "$1",
	},
	transformIgnorePatterns: ["/node_modules/(?!(@?aws-sdk|uuid)/)"],
};
