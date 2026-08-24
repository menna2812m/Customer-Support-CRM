/**
 * The sidebar is built from this manifest and filtered through the same
 * PermissionsService the route guards use, so a menu entry can never appear
 * without its route being reachable (spec section 6.3).
 *
 * `permission` is PROVISIONAL, referencing the same unresolved catalogue as
 * PermissionsService (open question P1).
 */
export interface NavItem {
  readonly id: string;
  readonly labelKey: string;
  readonly route: string;
  readonly icon: string;
  /** Omit for own-data destinations such as /notifications. */
  readonly permission?: string;
  readonly children?: readonly NavItem[];
}
