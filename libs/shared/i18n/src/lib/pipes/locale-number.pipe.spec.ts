import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { LanguageStore } from '../language.store';
import { LocaleNumberPipe } from './locale-number.pipe';

@Component({
  standalone: true,
  imports: [LocaleNumberPipe],
  template: `{{ value | localeNumber: options }}`,
})
class HostComponent {
  value = 1234.5;
  options: Intl.NumberFormatOptions | undefined = undefined;
}

describe('LocaleNumberPipe', () => {
  let fixture: ComponentFixture<HostComponent>;
  let language: LanguageStore;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    fixture = TestBed.createComponent(HostComponent);
    language = TestBed.inject(LanguageStore);
    fixture.detectChanges();
  });

  // `pure: false` is required: a pure pipe would memoize on the unchanged
  // `value`/`options` binding and never re-run `transform` after a language
  // switch, freezing the rendered text at whatever language was active on
  // first render (verified experimentally against `LocaleDatePipe` - see its
  // spec).
  //
  // Plain decimal formatting happens to render identically for bare "ar" and
  // "en" under this ICU/CLDR data (both resolve numberingSystem to "latn" -
  // confirmed via Intl.NumberFormat('ar').resolvedOptions()), so comparing
  // rendered text with the default options would not actually exercise the
  // re-render path. Currency formatting reliably differs (symbol placement
  // and RTL marks), so it is used here to make the switch observable without
  // pinning an exact ICU string.
  it('re-renders on a runtime language switch, with no change to its own input', () => {
    fixture.componentInstance.options = { style: 'currency', currency: 'USD' };

    language.setLanguage('en');
    fixture.detectChanges();
    const english = fixture.nativeElement.textContent;

    language.setLanguage('ar');
    fixture.detectChanges();
    const arabic = fixture.nativeElement.textContent;

    expect(arabic).not.toBe(english);
  });
});
