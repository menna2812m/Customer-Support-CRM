import { ReadableStream, TransformStream, WritableStream } from 'node:stream/web';
import { BroadcastChannel } from 'node:worker_threads';

/**
 * jsdom (this library's test environment, required by Angular's TestBed) does
 * not implement the Web Streams / BroadcastChannel globals that msw 2.x
 * depends on at import time. Node provides real implementations; this module
 * must be imported — for its side effect only — before anything that reaches
 * msw (directly or via `@crm/shared/testing`) is imported anywhere else.
 */
Object.assign(globalThis, { ReadableStream, WritableStream, TransformStream, BroadcastChannel });
