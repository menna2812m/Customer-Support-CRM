import { Directionality } from '@angular/cdk/bidi';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { DirectionService } from './direction.service';
import { LanguageStore } from './language.store';
import { provideAppDirection } from './provide-app-direction';

describe('DirectionService', () => {
  let language: LanguageStore;

  beforeEach(() => {
    // jsdom's `document` is shared across tests in this file, but
    // `Directionality` seeds its initial value from the *current*
    // document dir/lang (so a real app has no flash of the wrong
    // direction on boot). Reset it so each test starts from the same
    // clean slate a fresh page load would have.
    document.documentElement.removeAttribute('dir');
    document.documentElement.removeAttribute('lang');

    TestBed.configureTestingModule({ providers: [provideAppDirection()] });
    TestBed.inject(DirectionService).start();
    language = TestBed.inject(LanguageStore);
  });

  it('sets document lang and dir for English', () => {
    language.setLanguage('en');
    TestBed.tick();
    expect(document.documentElement.lang).toBe('en');
    expect(document.documentElement.dir).toBe('ltr');
  });

  it('sets document lang and dir for Arabic', () => {
    language.setLanguage('ar');
    TestBed.tick();
    expect(document.documentElement.lang).toBe('ar');
    expect(document.documentElement.dir).toBe('rtl');
  });

  it('drives the CDK Directionality that overlays and menus read', () => {
    const directionality = TestBed.inject(Directionality);
    language.setLanguage('ar');
    TestBed.tick();
    expect(directionality.value).toBe('rtl');
  });

  it('emits on the CDK change stream so open overlays reposition', () => {
    const directionality = TestBed.inject(Directionality);
    const seen: string[] = [];
    directionality.change.subscribe((dir) => seen.push(dir));

    language.setLanguage('ar');
    TestBed.tick();
    language.setLanguage('en');
    TestBed.tick();

    expect(seen).toEqual(['rtl', 'ltr']);
  });
});
