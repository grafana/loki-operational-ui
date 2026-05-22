import grafanaConfig from '@grafana/eslint-config/flat.js';

export default [
  ...grafanaConfig,
  {
    rules: {
      'react/prop-types': 'off',
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],

    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
      },
    },

    rules: {
      '@typescript-eslint/no-deprecated': 'warn',
    },
  },
  {
    files: ['./tests/**/*'],

    rules: {
      'react-hooks/rules-of-hooks': 'off',
    },
  },
];
