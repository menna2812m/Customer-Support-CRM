import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_LANGUAGE } from './language';
import { LanguageStore } from './language.store';

describe('LanguageStore', () => {
  let store: LanguageStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(LanguageStore);
  });

  it('starts at the default language', () => {
    expect(store.language()).toBe(DEFAULT_LANGUAGE);
  });

  it('updates the language signal when switched', () => {
    store.setLanguage('ar');
    expect(store.language()).toBe('ar');

    store.setLanguage('en');
    expect(store.language()).toBe('en');
  });

  it('derives ltr direction for English', () => {
    store.setLanguage('en');
    expect(store.direction()).toBe('ltr');
  });

  it('derives rtl direction for Arabic', () => {
    store.setLanguage('ar');
    expect(store.direction()).toBe('rtl');
  });
});
