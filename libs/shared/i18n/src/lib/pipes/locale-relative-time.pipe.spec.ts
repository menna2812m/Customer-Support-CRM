import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { LanguageStore } from '../language.store';
import { LocaleRelativeTimePipe } from './locale-relative-time.pipe';

@Component({
  standalone: true,
  imports: [LocaleRelativeTimePipe],
  template: `{{ value | localeRelativeTime }}`,
})
class HostComponent {
  value = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
}

describe('LocaleRelativeTimePipe', () => {
  let fixture: ComponentFixture<HostComponent>;
  let language: LanguageStore;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    fixture = TestBed.createComponent(HostComponent);
    language = TestBed.inject(LanguageStore);
    fixture.detectChanges();
  });

  // `pure: false` is required: a pure pipe would memoize on the unchanged
  // `value` binding and never re-run `transform` after a language switch,
  // freezing the rendered text at whatever language was active on first
  // render (verified experimentally against `LocaleDatePipe` - see its spec).
  it('re-renders on a runtime language switch, with no change to its own input', () => {
    language.setLanguage('en');
    fixture.detectChanges();
    const english = fixture.nativeElement.textContent;

    language.setLanguage('ar');
    fixture.detectChanges();
    const arabic = fixture.nativeElement.textContent;

    expect(arabic).not.toBe(english);
  });
});
