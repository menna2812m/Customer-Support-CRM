import { computed, inject, Injectable, signal } from '@angular/core';
import type { NavItem } from './navigation';
import { PermissionsService } from './permissions.service';

/**
 * Builds the sidebar from a declarative manifest, filtered through the same
 * PermissionsService the route guards use. A parent whose children are all
 * filtered away is itself dropped, so no menu entry can point at an
 * unreachable route (spec section 6.3).
 */
@Injectable({ providedIn: 'root' })
export class NavigationService {
  private readonly permissions = inject(PermissionsService);
  private readonly manifest = signal<readonly NavItem[]>([]);

  readonly visible = computed(() => this.filter(this.manifest()));

  setManifest(items: readonly NavItem[]): void {
    this.manifest.set(items);
  }

  private filter(items: readonly NavItem[]): NavItem[] {
    const result: NavItem[] = [];

    for (const item of items) {
      if (item.permission && !this.permissions.has(item.permission)) {
        continue;
      }

      if (item.children?.length) {
        const children = this.filter(item.children);
        // A parent whose children are all filtered away is itself unreachable.
        if (children.length === 0) {
          continue;
        }
        result.push({ ...item, children });
        continue;
      }

      result.push(item);
    }

    return result;
  }
}
