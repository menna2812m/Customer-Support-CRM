import '@angular/compiler';
import './msw-jsdom-polyfills';
import '@analogjs/vitest-angular/setup-snapshots';
import { setupTestBed } from '@analogjs/vitest-angular/setup-testbed';
import { afterAll, afterEach, beforeAll } from 'vitest';
// MSW harness consumed through @crm/shared/testing per the msw/node boundary
// rule (root eslint.config.mjs) — this library must never import msw/node
// directly. Import order matters: the polyfill above must execute before
// this pulls in msw's own top-level code.
import { mswServer } from '@crm/shared/testing';

setupTestBed();

beforeAll(() => mswServer.listen({ onUnhandledRequest: 'error' }));
afterEach(() => mswServer.resetHandlers());
afterAll(() => mswServer.close());
