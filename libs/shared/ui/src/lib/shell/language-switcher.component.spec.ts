import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { DEVICE_LANGUAGE_KEY, LanguageStore } from '@crm/shared/i18n';
import {
  flushTranslation,
  translationProviders,
} from '../../testing/translation-harness';
import { LanguageSwitcherComponent } from './language-switcher.component';

describe('LanguageSwitcherComponent', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [LanguageSwitcherComponent],
      providers: translationProviders,
    });
    flushTranslation({
      'shell.language': 'Language',
      'shell.languageName.en': 'English',
      'shell.languageName.ar': 'العربية',
    });
  });

  it('treats a switch as an explicit user choice, writing the device preference', () => {
    const fixture = TestBed.createComponent(LanguageSwitcherComponent);
    fixture.detectChanges();

    fixture.componentInstance.choose('ar');
    // Switching activates Arabic, which the loader then fetches.
    TestBed.inject(HttpTestingController)
      .expectOne('/i18n/ar.json')
      .flush({
        'shell.language': 'اللغة',
        'shell.languageName.en': 'English',
        'shell.languageName.ar': 'العربية',
      });
    fixture.detectChanges();

    expect(TestBed.inject(LanguageStore).language()).toBe('ar');
    expect(localStorage.getItem(DEVICE_LANGUAGE_KEY)).toBe('ar');
  });

  it('offers every supported language', () => {
    const fixture = TestBed.createComponent(LanguageSwitcherComponent);
    fixture.detectChanges();

    const options = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('option'),
    ).map((option) => option.getAttribute('value'));

    expect(options).toEqual(['en', 'ar']);
  });
});
