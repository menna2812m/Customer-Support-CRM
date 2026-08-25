import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { LanguageStore } from '../language.store';
import { LocaleDatePipe } from './locale-date.pipe';

@Component({
  standalone: true,
  imports: [LocaleDatePipe],
  template: `{{ value | localeDate: { month: 'long' } }}`,
})
class HostComponent {
  value = '2026-08-24T09:30:00Z';
}

describe('LocaleDatePipe', () => {
  let fixture: ComponentFixture<HostComponent>;
  let language: LanguageStore;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    fixture = TestBed.createComponent(HostComponent);
    language = TestBed.inject(LanguageStore);
    fixture.detectChanges();
  });

  // This is the regression this pipe must not reintroduce: it is `pure: false`
  // because the formatted output depends on `LanguageStore`'s signal, not on
  // this binding's own arguments (`value`, `options`), which never change
  // here. Verified experimentally - flipping the pipe to `pure: true` freezes
  // the rendered text at its first ("August") value forever, because Angular
  // memoizes on the unchanged pipe arguments and never calls `transform`
  // again, even after the language switch marks the view dirty.
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
