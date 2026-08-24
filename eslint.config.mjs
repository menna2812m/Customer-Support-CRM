import nx from '@nx/eslint-plugin';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: ['**/dist', '**/out-tsc', '**/vitest.config.*.timestamp*'],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: [],
          depConstraints: [
            // --- layer rules (spec section 4.3) ---
            {
              sourceTag: 'type:app',
              onlyDependOnLibsWithTags: [
                'type:feature',
                'type:ui',
                'type:data-access',
                'type:model',
                'type:util',
              ],
            },
            {
              sourceTag: 'type:feature',
              onlyDependOnLibsWithTags: [
                'type:data-access',
                'type:ui',
                'type:model',
                'type:util',
              ],
            },
            {
              sourceTag: 'type:data-access',
              onlyDependOnLibsWithTags: ['type:model', 'type:util'],
            },
            {
              sourceTag: 'type:ui',
              onlyDependOnLibsWithTags: ['type:ui', 'type:model', 'type:util'],
            },
            { sourceTag: 'type:model', onlyDependOnLibsWithTags: [] },
            {
              sourceTag: 'type:util',
              onlyDependOnLibsWithTags: ['type:util', 'type:model'],
            },

            // --- application separation (spec section 4.3) ---
            {
              sourceTag: 'scope:agent',
              onlyDependOnLibsWithTags: ['scope:agent', 'scope:shared'],
            },
            {
              sourceTag: 'scope:portal',
              onlyDependOnLibsWithTags: ['scope:portal', 'scope:shared'],
            },
            {
              sourceTag: 'scope:shared',
              onlyDependOnLibsWithTags: ['scope:shared'],
            },
          ],
        },
      ],

      // --- PrimeNG boundary (spec sections 4.3, 9.4) ---
      // --- MSW node/browser boundary (task 3 review, finding 2) ---
      // Overridden to 'off' only in libs/shared/ui/eslint.config.mjs and
      // libs/shared/testing/eslint.config.mjs respectively.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['primeng', 'primeng/*', '@primeuix/*'],
              message:
                'PrimeNG may only be imported inside libs/shared/ui (spec sections 4.3, 9.4). ' +
                'Consume it through a shared/ui component instead.',
            },
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
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    // Override or add rules here
    rules: {},
  },
];
