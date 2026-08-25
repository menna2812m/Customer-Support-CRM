import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { LanguageStore } from '@crm/shared/i18n';
import { DirectionalIconComponent } from './directional-icon.component';

describe('DirectionalIconComponent', () => {
  let language: LanguageStore;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [DirectionalIconComponent] });
    language = TestBed.inject(LanguageStore);
  });

  const render = (name: string, mirrored = true) => {
    const fixture = TestBed.createComponent(DirectionalIconComponent);
    fixture.componentRef.setInput('name', name);
    fixture.componentRef.setInput('mirrored', mirrored);
    fixture.detectChanges();
    return fixture.nativeElement.querySelector('span') as HTMLElement;
  };

  it('does not mirror in a left-to-right language', () => {
    language.setLanguage('en');
    expect(
      render('arrow-forward').classList.contains('crm-icon--mirrored'),
    ).toBe(false);
  });

  it('mirrors a directional icon in a right-to-left language', () => {
    language.setLanguage('ar');
    expect(
      render('arrow-forward').classList.contains('crm-icon--mirrored'),
    ).toBe(true);
  });

  it('leaves a non-directional icon unmirrored even in Arabic', () => {
    language.setLanguage('ar');
    expect(
      render('search', false).classList.contains('crm-icon--mirrored'),
    ).toBe(false);
  });
});
