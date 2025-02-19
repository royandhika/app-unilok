import pluginJs from "@eslint/js";
import pluginPrettier from "eslint-plugin-prettier";
import globals from "globals";

/** @type {import('eslint').Linter.Config[]} */
export default [
    {
        languageOptions: { globals: globals.node },
    },
    pluginJs.configs.recommended,
    {
        plugins: { prettier: pluginPrettier },
        rules: {
            "prettier/prettier": "warn", // Pastikan kode sesuai aturan Prettier
        
            // Best Practices
            "no-console": "warn",
            "no-debugger": "error",
            "no-eval": "error",
            "eqeqeq": ["error", "always"],
            "prefer-const": "warn",

            // Security
            "no-unused-vars": "warn",
            "no-shadow": "warn",
            "no-prototype-builtins": "error",

            // Konsistensi
            "capitalized-comments": ["warn", "always"],
            "camelcase": ["warn", { "properties": "always" }],
            "func-style": ["error", "expression"],

            // Struktur Kode
            "no-magic-numbers": ["warn", { "ignore": [0, 1] }],
            "no-unreachable": "error",
            "no-duplicate-imports": "error"
        },
    },
];
