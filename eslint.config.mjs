// @ts-check
/*
 * one flat config for the whole repo.
 * - type-checked typescript-eslint rules for every TS and JS file
 * - browser-only rules are scoped to web/**; node code (tools, scripts) may use console and process.env
 * - generated code and build output are never linted
 */
import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
    globalIgnores(['**/node_modules/**', '**/gen/**', '**/bin/**', '**/obj/**', '**/dist/**']),
    js.configs.recommended,
    tseslint.configs.strictTypeChecked,
    tseslint.configs.stylisticTypeChecked,
    {
        languageOptions: {
            parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
            globals: globals.node,
        },
        rules: {
            curly: ['error', 'all'],
            // template literals with numbers are fine in console demos
            '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
        },
    },
    {
        files: ['web/**'],
        languageOptions: { globals: globals.browser },
    },
    {
        // the browser bundle has no process.env and console output is invisible to the audience
        files: ['web/src/**'],
        rules: {
            'no-console': 'warn',
            'no-restricted-properties': ['error', { object: 'process', property: 'env', message: 'Use import.meta.env in the browser bundle.' }],
        },
    },
);
