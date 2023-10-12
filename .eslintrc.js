module.exports = {
    env: {
        browser: false,
        es2021: true,
        mocha: true,
        node: true,
    },
    plugins: ["@typescript-eslint"],
    extends: [
        "standard",
        "plugin:prettier/recommended",
        "plugin:node/recommended",
    ],
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaVersion: 12,
    },
    rules: {
        "node/no-unsupported-features/es-syntax": [
            "error",
            { ignores: ["modules"] },
        ],
        "node/no-unpublished-import": "off",
        "no-unused-vars": "warn",
        "no-unused-expressions": "warn",
        eqeqeq: "warn",
    },
    settings: {
        node: {
            tryExtensions: [".js", ".json", ".node", ".ts"],
            engines: { node: ">=12" },
        },
    },
    ignorePatterns: ["*.css"],
};
