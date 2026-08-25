import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let toast: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    toast = TestBed.inject(ToastService);
  });

  it('starts with no messages', () => {
    expect(toast.messages()).toEqual([]);
  });

  it('exposes a retry action for a retriable failure', () => {
    toast.error({
      code: 'http.unknown_error',
      retriable: true,
      traceId: 't-1',
    });
    const [message] = toast.messages();
    expect(message.retriable).toBe(true);
  });

  it('surfaces traceId on an actionable failure', () => {
    toast.error({
      code: 'ticket.update_failed',
      retriable: false,
      traceId: 't-9',
    });
    expect(toast.messages()[0].traceId).toBe('t-9');
  });

  it('translates from the error code, never from a server message', () => {
    toast.error({ code: 'ticket.not_found', retriable: false });
    expect(toast.messages()[0].messageKey).toBe('errors.ticket.not_found');
  });

  it('dismisses by id', () => {
    toast.success('shell.saved');
    const [message] = toast.messages();
    toast.dismiss(message.id);
    expect(toast.messages()).toEqual([]);
  });
});
