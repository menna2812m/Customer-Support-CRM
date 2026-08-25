import nx from '@nx/eslint-plugin';
import baseConfig from '../../../eslint.config.mjs';

export default [
  ...nx.configs['flat/angular'],
  ...nx.configs['flat/angular-template'],
  ...baseConfig,
  {
    files: ['**/*.ts'],
    rules: {
      // shared/ui is the ONLY library permitted to import primeng/* and
      // @primeuix/* (spec sections 4.3, 9.4). The rule is re-declared rather
      // than switched off so the msw/node boundary from the root config keeps
      // applying here — this library ships to the browser, so a Node-only
      // import would be a real defect.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['msw/node'],
              message:
                'msw/node may only be imported inside libs/shared/testing. It pulls in Node-only ' +
                'APIs and must never reach a browser bundle; consume the MSW harness through ' +
                '@crm/shared/testing (node/test code) or the future @crm/shared/testing/browser ' +
                'entry point (browser code) instead.',
            },
          ],
        },
      ],
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'crm',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          // 'crm', not the library default 'lib': shared/ui components are the
          // application-facing primitives and carry the product prefix.
          type: 'element',
          prefix: 'crm',
          style: 'kebab-case',
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    // Override or add rules here
    rules: {},
  },
];
