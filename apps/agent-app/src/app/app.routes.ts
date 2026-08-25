import { inject } from '@angular/core';
import { Route, Router } from '@angular/router';
import { authenticatedGuard } from '@crm/shared/auth';
import { requirePermission } from '@crm/shared/permissions';
import { resolveLandingRoute } from './landing.resolver';

const placeholder = () =>
  import('./pages/placeholder.page').then((m) => m.PlaceholderPage);

export const appRoutes: Route[] = [
  {
    path: 'auth/login',
    loadComponent: () => import('./pages/login.page').then((m) => m.LoginPage),
  },

  {
    path: '',
    canMatch: [authenticatedGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        canMatch: [() => inject(Router).parseUrl(resolveLandingRoute())],
        loadComponent: placeholder,
      },

      // --- operational routes: desktop-first, tablet usable, phone unsupported ---
      {
        path: 'tickets',
        data: { responsive: 'operational' },
        canMatch: [requirePermission('ticket.view')],
        loadComponent: placeholder,
      },
      {
        path: 'customers',
        data: { responsive: 'operational' },
        canMatch: [requirePermission('customer.view')],
        loadComponent: placeholder,
      },
      {
        path: 'kb',
        data: { responsive: 'operational' },
        canMatch: [requirePermission('kb.view')],
        loadComponent: placeholder,
      },
      {
        path: 'admin',
        data: { responsive: 'operational' },
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'users' },
          {
            path: 'users',
            canMatch: [requirePermission('user.manage')],
            loadComponent: placeholder,
          },
          {
            path: 'roles',
            canMatch: [requirePermission('role.manage')],
            loadComponent: placeholder,
          },
          {
            path: 'departments',
            canMatch: [requirePermission('org.manage')],
            loadComponent: placeholder,
          },
          {
            path: 'branches',
            canMatch: [requirePermission('org.manage')],
            loadComponent: placeholder,
          },
          {
            path: 'sla',
            canMatch: [requirePermission('sla.manage')],
            loadComponent: placeholder,
          },
          {
            path: 'escalation',
            canMatch: [requirePermission('sla.manage')],
            loadComponent: placeholder,
          },
          {
            path: 'channels',
            canMatch: [requirePermission('channel.manage')],
            loadComponent: placeholder,
          },
          {
            path: 'integrations',
            canMatch: [requirePermission('integration.manage')],
            loadComponent: placeholder,
          },
          {
            path: 'audit-log',
            canMatch: [requirePermission('audit.view')],
            loadComponent: placeholder,
          },
        ],
      },

      // --- dashboard and KPI routes: responsive on phones ---
      {
        path: 'dashboard',
        data: { responsive: 'dashboard' },
        canMatch: [requirePermission('dashboard.view')],
        loadComponent: placeholder,
      },
      {
        path: 'reports',
        data: { responsive: 'dashboard' },
        canMatch: [requirePermission('report.view')],
        loadComponent: placeholder,
      },

      // --- own-data routes: no permission required ---
      { path: 'notifications', loadComponent: placeholder },
      { path: 'settings/profile', loadComponent: placeholder },
    ],
  },

  {
    path: '403',
    loadComponent: () =>
      import('./pages/forbidden.page').then((m) => m.ForbiddenPage),
  },
  {
    path: 'offline',
    loadComponent: () =>
      import('./pages/offline.page').then((m) => m.OfflinePage),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./pages/not-found.page').then((m) => m.NotFoundPage),
  },
];
