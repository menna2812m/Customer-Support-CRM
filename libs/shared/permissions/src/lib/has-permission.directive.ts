import {
  Directive,
  effect,
  inject,
  input,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import { PermissionsService } from './permissions.service';

/**
 * Third enforcement surface: action UI (spec section 6.3). Removes the element
 * from the DOM rather than hiding it visually, so a denied action cannot be
 * probed for or triggered through devtools/markup manipulation. This is still
 * a UX affordance, not a security boundary — the backend independently
 * enforces authorization on every request (spec section 6.1).
 *
 * Placed here, not in shared/ui, so the design-system library does not depend
 * on the permission engine — see the plan's placement note.
 */
@Directive({ selector: '[appHasPermission]', standalone: true })
export class HasPermissionDirective {
  private readonly permissions = inject(PermissionsService);
  private readonly template = inject(TemplateRef<unknown>);
  private readonly container = inject(ViewContainerRef);

  readonly appHasPermission = input.required<string>();

  constructor() {
    effect(() => {
      const allowed = this.permissions.has(this.appHasPermission());
      this.container.clear();
      if (allowed) {
        this.container.createEmbeddedView(this.template);
      }
    });
  }
}
