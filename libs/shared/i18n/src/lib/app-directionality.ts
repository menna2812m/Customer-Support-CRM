import { Direction, Directionality } from '@angular/cdk/bidi';
import { Injectable } from '@angular/core';

/**
 * Directionality is what CDK - and therefore PrimeNG's overlays, menus, and
 * dropdowns - reads to decide which way to flip. Extending it keeps direction
 * on a supported API rather than any vendor internal (spec section 9.3).
 *
 * `Directionality.value` is a read-only getter backed by a public
 * `valueSignal: WritableSignal<Direction>`. Writing through that signal - not
 * assigning `value` directly, which has no setter - is the supported way to
 * drive it, and emitting on `change` afterwards is what makes already-open
 * CDK overlays reposition themselves.
 */
@Injectable({ providedIn: 'root' })
export class AppDirectionality extends Directionality {
  update(direction: Direction): void {
    if (this.value === direction) {
      return;
    }
    this.valueSignal.set(direction);
    this.change.emit(direction);
  }
}
