import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import globals from 'globals';

export default [
  eslint.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json',
      },
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      // Disable base rules that conflict with TypeScript
      'no-unused-vars': 'off',
      'no-undef': 'off', // TypeScript handles this

      // TypeScript rules
      '@typescript-eslint/no-explicit-any': 'off', // Allow any for flexibility
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // General rules
      'no-console': 'off', // Allow console in Node.js
    },
  },
  {
    ignores: ['node_modules', 'dist', '*.config.js', '*.config.mjs'],
  },
];
