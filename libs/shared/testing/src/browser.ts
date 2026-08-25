import { setupWorker } from 'msw/browser';
import { handlers } from './lib/handlers';

/**
 * The browser half of the MSW harness, kept in its own entry point so the
 * node-only `msw/node` server in `index.ts` can never reach a browser bundle
 * (see the root eslint config's msw boundary).
 */
export const worker = setupWorker(...handlers);
