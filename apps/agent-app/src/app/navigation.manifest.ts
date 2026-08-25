import type { NavItem } from '@crm/shared/permissions';

/**
 * PROVISIONAL permission names (open question P1). The manifest and the route
 * guards must always name the same permission — that is what guarantees a menu
 * entry cannot point at an unreachable route (spec section 6.3).
 */
export const AGENT_NAVIGATION: readonly NavItem[] = [
  {
    id: 'dashboard',
    labelKey: 'nav.dashboard',
    route: '/dashboard',
    icon: 'home',
    permission: 'dashboard.view',
  },
  {
    id: 'tickets',
    labelKey: 'nav.tickets',
    route: '/tickets',
    icon: 'inbox',
    permission: 'ticket.view',
  },
  {
    id: 'customers',
    labelKey: 'nav.customers',
    route: '/customers',
    icon: 'users',
    permission: 'customer.view',
  },
  {
    id: 'kb',
    labelKey: 'nav.kb',
    route: '/kb',
    icon: 'book',
    permission: 'kb.view',
  },
  {
    id: 'reports',
    labelKey: 'nav.reports',
    route: '/reports',
    icon: 'chart',
    permission: 'report.view',
  },
  {
    id: 'admin',
    labelKey: 'nav.admin',
    route: '/admin',
    icon: 'cog',
    children: [
      {
        id: 'users',
        labelKey: 'nav.users',
        route: '/admin/users',
        icon: 'user',
        permission: 'user.manage',
      },
      {
        id: 'roles',
        labelKey: 'nav.roles',
        route: '/admin/roles',
        icon: 'key',
        permission: 'role.manage',
      },
      {
        id: 'departments',
        labelKey: 'nav.departments',
        route: '/admin/departments',
        icon: 'sitemap',
        permission: 'org.manage',
      },
      {
        id: 'branches',
        labelKey: 'nav.branches',
        route: '/admin/branches',
        icon: 'map',
        permission: 'org.manage',
      },
      {
        id: 'sla',
        labelKey: 'nav.sla',
        route: '/admin/sla',
        icon: 'clock',
        permission: 'sla.manage',
      },
      {
        id: 'escalation',
        labelKey: 'nav.escalation',
        route: '/admin/escalation',
        icon: 'arrow-up',
        permission: 'sla.manage',
      },
      {
        id: 'channels',
        labelKey: 'nav.channels',
        route: '/admin/channels',
        icon: 'share',
        permission: 'channel.manage',
      },
      {
        id: 'integrations',
        labelKey: 'nav.integrations',
        route: '/admin/integrations',
        icon: 'plug',
        permission: 'integration.manage',
      },
      {
        id: 'audit',
        labelKey: 'nav.audit',
        route: '/admin/audit-log',
        icon: 'list',
        permission: 'audit.view',
      },
    ],
  },
  {
    id: 'notifications',
    labelKey: 'nav.notifications',
    route: '/notifications',
    icon: 'bell',
  },
];
