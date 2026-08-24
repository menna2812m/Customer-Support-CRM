import { describe, expect, it, vi } from 'vitest';
import { sanitizeTelemetry, TELEMETRY_ALLOWLIST } from './telemetry';

describe('sanitizeTelemetry', () => {
  it('keeps allowlisted fields', () => {
    const result = sanitizeTelemetry({
      route: '/tickets',
      locale: 'ar',
      direction: 'rtl',
      errorCode: 'ticket.not_found',
      traceId: 't-1',
      durationMs: 120,
    });
    expect(result).toEqual({
      route: '/tickets',
      locale: 'ar',
      direction: 'rtl',
      errorCode: 'ticket.not_found',
      traceId: 't-1',
      durationMs: 120,
    });
  });

  it.each([
    'customerName', 'email', 'phone', 'ticketBody', 'chatMessage',
    'attachmentName', 'searchQuery', 'subject',
  ])('drops the non-allowlisted field "%s"', (field) => {
    expect(sanitizeTelemetry({ route: '/x', [field]: 'sensitive' })).toEqual({ route: '/x' });
  });

  it('drops an arbitrary domain object rather than serializing it', () => {
    expect(sanitizeTelemetry({ route: '/x', ticket: { id: 't1', title: 'Broken' } })).toEqual({
      route: '/x',
    });
  });

  it('drops an allowlisted key whose value is a smuggled-in object', () => {
    expect(
      sanitizeTelemetry({ route: { path: '/x', customerName: 'Ada' } as unknown as string }),
    ).toEqual({});
  });

  it('warns in development when a field is dropped', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    sanitizeTelemetry({ customerName: 'Ada' });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('customerName'));
    warn.mockRestore();
  });

  it('does not allowlist any content-bearing field', () => {
    for (const field of ['ticketBody', 'chatMessage', 'customerName', 'searchQuery']) {
      expect(TELEMETRY_ALLOWLIST.has(field)).toBe(false);
    }
  });
});
