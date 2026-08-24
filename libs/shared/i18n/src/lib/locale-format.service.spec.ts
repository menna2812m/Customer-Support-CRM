import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { LanguageStore } from './language.store';
import { LocaleFormatService } from './locale-format.service';

describe('LocaleFormatService', () => {
  let format: LocaleFormatService;
  let language: LanguageStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    format = TestBed.inject(LocaleFormatService);
    language = TestBed.inject(LanguageStore);
  });

  it('accepts an ISO-8601 UTC timestamp, the API and internal invariant', () => {
    expect(() => format.date('2026-08-24T09:30:00Z')).not.toThrow();
  });

  it('rejects a timestamp without timezone information', () => {
    expect(() => format.date('2026-08-24 09:30:00')).toThrowError(/ISO-8601/);
  });

  it('accepts a Date instance without ambiguity (no string parsing involved)', () => {
    expect(() => format.date(new Date('2026-08-24T09:30:00Z'))).not.toThrow();
  });

  it('formats numbers differently per language without re-injection', () => {
    language.setLanguage('en');
    const english = format.number(1234.5);
    language.setLanguage('ar');
    const arabic = format.number(1234.5);

    expect(english).toBe('1,234.5');
    expect(arabic).not.toBe('');
    // Western digits: Arabic-Indic numerals are explicitly NOT a requirement
    // (spec section 2, locale rules), so the digit set must not change -
    // pinned via the `nu-latn` locale extension, not left to locale defaults.
    expect(arabic).toMatch(/[0-9]/);
    expect(/[٠-٩]/.test(arabic)).toBe(false);
  });

  it('follows a runtime language switch for dates, without re-injecting the service', () => {
    language.setLanguage('en');
    const english = format.date('2026-08-24T09:30:00Z', { month: 'long' });
    language.setLanguage('ar');
    const arabic = format.date('2026-08-24T09:30:00Z', { month: 'long' });

    expect(english).not.toBe(arabic);
    // Western digit set holds for dates too.
    expect(/[٠-٩]/.test(arabic)).toBe(false);
  });

  it('renders relative time from a fixed reference point', () => {
    language.setLanguage('en');
    const result = format.relativeTime('2026-08-24T09:00:00Z', new Date('2026-08-24T11:00:00Z'));
    expect(result).toMatch(/2 hours ago/);
  });

  it('renders relative time differently per language without re-injection', () => {
    language.setLanguage('en');
    const english = format.relativeTime('2026-08-24T09:00:00Z', new Date('2026-08-24T11:00:00Z'));
    language.setLanguage('ar');
    const arabic = format.relativeTime('2026-08-24T09:00:00Z', new Date('2026-08-24T11:00:00Z'));

    expect(english).not.toBe(arabic);
  });
});
