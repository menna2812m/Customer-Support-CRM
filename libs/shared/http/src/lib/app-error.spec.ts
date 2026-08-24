import { HttpErrorResponse } from '@angular/common/http';
import { describe, expect, it } from 'vitest';
import { toAppError } from './app-error';

const httpError = (status: number, error: unknown) =>
  new HttpErrorResponse({ status, error, url: 'http://localhost/api/x' });

describe('toAppError', () => {
  it('maps a backend error envelope onto AppError', () => {
    const result = toAppError(
      httpError(404, { code: 'ticket.not_found', message: 'Not found', traceId: 'trace-9' }),
    );
    expect(result).toEqual({
      code: 'ticket.not_found',
      httpStatus: 404,
      traceId: 'trace-9',
      retriable: false,
      details: undefined,
    });
  });

  it('preserves structured details for field validation', () => {
    const details = { fields: { title: 'required' } };
    const result = toAppError(httpError(422, { code: 'validation.failed', message: 'x', details }));
    expect(result.details).toEqual(details);
  });

  it('marks network failure (status 0) retriable', () => {
    expect(toAppError(httpError(0, null)).retriable).toBe(true);
  });

  it.each([502, 503, 504, 429])('marks status %i retriable', (status) => {
    expect(toAppError(httpError(status, null)).retriable).toBe(true);
  });

  it.each([400, 401, 403, 404, 409, 422])('marks status %i non-retriable', (status) => {
    expect(toAppError(httpError(status, null)).retriable).toBe(false);
  });

  it('falls back to a generic code when the backend sends no envelope', () => {
    const result = toAppError(httpError(500, 'plain text failure'));
    expect(result.code).toBe('http.unknown_error');
    expect(result.httpStatus).toBe(500);
  });

  it('wraps a non-HTTP throwable', () => {
    const result = toAppError(new TypeError('boom'));
    expect(result).toEqual({ code: 'client.unexpected_error', retriable: false, details: 'boom' });
  });
});
