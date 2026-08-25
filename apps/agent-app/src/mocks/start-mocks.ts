/**
 * There is no backend yet, so development and the acceptance suite both run
 * against the MSW handlers.
 *
 * This module is REPLACED at build time by `start-mocks.prod.ts` in the
 * production configuration (see `fileReplacements` in project.json). Gating the
 * dynamic import on `isDevMode()` instead would still emit the MSW handlers —
 * and the fixture identity inside them — as a lazy chunk of the production
 * bundle: never requested, but shipped.
 */
export async function startMocks(): Promise<void> {
  const { worker } = await import('@crm/shared/testing/browser');
  await worker.start({ onUnhandledRequest: 'bypass' });
}
