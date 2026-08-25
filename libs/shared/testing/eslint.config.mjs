import baseConfig from '../../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    files: ['**/*.ts'],
    rules: {
      // This library is the one place allowed to import msw/node (see the
      // root eslint.config.mjs comment on the MSW node/browser boundary).
      'no-restricted-imports': 'off',
    },
  },
];
