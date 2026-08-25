export type AppLanguage = 'ar' | 'en';

export const SUPPORTED_LANGUAGES: readonly AppLanguage[] = ['en', 'ar'] as const;
export const DEFAULT_LANGUAGE: AppLanguage = 'en';

/** Languages written right-to-left. Direction is derived from this (spec section 9.3). */
export const RTL_LANGUAGES: ReadonlySet<AppLanguage> = new Set<AppLanguage>(['ar']);

export function isAppLanguage(value: unknown): value is AppLanguage {
  return typeof value === 'string' && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}
