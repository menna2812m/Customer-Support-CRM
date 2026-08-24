import { computed, inject, Injectable } from '@angular/core';
import { LanguageStore } from './language.store';

/**
 * Locale-aware formatting driven by a signal, because LOCALE_ID resolves once at
 * injection time and cannot follow a runtime language switch (spec section 9.2).
 *
 * Feature code must use these abstractions for locale-dependent formatting. This
 * is a targeted requirement about locale-dependent formatting, not a blanket ban
 * on Angular's own pipes.
 */
@Injectable({ providedIn: 'root' })
export class LocaleFormatService {
  private readonly languageStore = inject(LanguageStore);

  /**
   * Numbering system is pinned to `latn`: Arabic-Indic numerals are explicitly
   * not a requirement (spec section 2). Revisit only if that changes.
   */
  private readonly locale = computed(() => `${this.languageStore.language()}-u-nu-latn`);

  date(value: string | Date, options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }): string {
    return new Intl.DateTimeFormat(this.locale(), options).format(this.toDate(value));
  }

  number(value: number, options: Intl.NumberFormatOptions = {}): string {
    return new Intl.NumberFormat(this.locale(), options).format(value);
  }

  relativeTime(value: string | Date, now: Date = new Date()): string {
    const deltaSeconds = (this.toDate(value).getTime() - now.getTime()) / 1000;
    const formatter = new Intl.RelativeTimeFormat(this.locale(), { numeric: 'auto' });

    const units: [Intl.RelativeTimeFormatUnit, number][] = [
      ['year', 31_536_000],
      ['month', 2_592_000],
      ['day', 86_400],
      ['hour', 3_600],
      ['minute', 60],
      ['second', 1],
    ];

    for (const [unit, seconds] of units) {
      if (Math.abs(deltaSeconds) >= seconds || unit === 'second') {
        return formatter.format(Math.round(deltaSeconds / seconds), unit);
      }
    }
    return formatter.format(0, 'second');
  }

  /**
   * Timestamps are ISO-8601 UTC at the API boundary and internally
   * (spec section 8.5). Display timezone policy is open question P3; until it is
   * decided, values render in the browser's resolved timezone. No policy is
   * asserted here, and no timezone conversion or parameter is added.
   *
   * A string with no timezone information (e.g. "2026-08-24 09:30:00") is
   * ambiguous - parsing it would silently apply the viewer's local timezone
   * and produce a wrong time, which in a support CRM means a wrong SLA
   * deadline - so it is rejected loudly instead of silently reinterpreted.
   */
  private toDate(value: string | Date): Date {
    if (value instanceof Date) {
      return value;
    }
    if (!/(?:Z|[+-]\d{2}:?\d{2})$/.test(value)) {
      throw new Error(
        `Timestamp "${value}" is not ISO-8601 with timezone information. ` +
          `Timestamps are ISO-8601 UTC at the API boundary (spec section 8.5).`,
      );
    }
    return new Date(value);
  }
}
