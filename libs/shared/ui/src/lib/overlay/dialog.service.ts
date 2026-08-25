import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { ComponentType } from '@angular/cdk/overlay';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

/**
 * Typed dialog opening on the CDK, which reads the same Directionality the
 * DirectionService drives — so overlays flip with the language automatically
 * (spec section 9.3).
 */
@Injectable({ providedIn: 'root' })
export class DialogService {
  private readonly dialog = inject(Dialog);

  open<TResult, TData = unknown>(
    component: ComponentType<unknown>,
    data?: TData,
  ): Observable<TResult | undefined> {
    const ref: DialogRef<TResult> = this.dialog.open<TResult>(component, {
      data,
      hasBackdrop: true,
      autoFocus: 'first-tabbable',
      restoreFocus: true,
    });
    return ref.closed;
  }
}
