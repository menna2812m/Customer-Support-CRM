/**
 * PROVISIONAL development fixtures (open question P1). Permission names here are
 * placeholders and MUST be replaced with the confirmed catalogue before any
 * permission-sensitive domain implementation.
 */
export const PROVISIONAL_IDENTITY = {
  userId: 'user-1',
  displayName: 'Test Agent',
  language: 'en' as const,
  permissions: [
    { permission: 'dashboard.view', scope: 'own' as const },
    { permission: 'ticket.view', scope: 'department' as const },
    { permission: 'ticket.create', scope: 'department' as const },
    { permission: 'customer.view', scope: 'department' as const },
  ],
  departments: [{ id: 'dept-1', name: 'Support' }],
  branches: [{ id: 'branch-1', name: 'Riyadh' }],
};
