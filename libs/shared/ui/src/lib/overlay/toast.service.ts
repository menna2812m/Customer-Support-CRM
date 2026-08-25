import { Injectable, signal } from '@angular/core';
import type { AppError } from '@crm/shared/http';

export interface ToastMessage {
  readonly id: number;
  readonly severity: 'success' | 'error' | 'info';
  readonly messageKey: string;
  readonly retriable: boolean;
  readonly traceId?: string;
}

let nextId = 0;

/**
 * Action failures surface as toasts, with retry when retriable and the
 * backend-authoritative traceId when present (spec section 10.1). Messages are
 * translated from the error CODE; the server's `message` is a developer
 * diagnostic and is never shown (spec section 8.5).
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly queue = signal<ToastMessage[]>([]);
  readonly messages = this.queue.asReadonly();

  success(messageKey: string): void {
    this.push({ severity: 'success', messageKey, retriable: false });
  }

  info(messageKey: string): void {
    this.push({ severity: 'info', messageKey, retriable: false });
  }

  error(error: AppError): void {
    this.push({
      severity: 'error',
      messageKey: `errors.${error.code}`,
      retriable: error.retriable,
      traceId: error.traceId,
    });
  }

  dismiss(id: number): void {
    this.queue.update((messages) =>
      messages.filter((message) => message.id !== id),
    );
  }

  private push(message: Omit<ToastMessage, 'id'>): void {
    this.queue.update((messages) => [
      ...messages,
      { ...message, id: nextId++ },
    ]);
  }
}
