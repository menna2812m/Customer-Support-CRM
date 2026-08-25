import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageStore } from '@crm/shared/i18n';
import {
  flushTranslation,
  translationProviders,
} from '../../testing/translation-harness';
import { UiButtonComponent } from './ui-button.component';

/**
 * The three behaviours below are the entire reason this exists instead of a
 * raw PrimeNG button: a translation-key label, a loading state that also
 * disables and announces itself, and a direction-aware icon.
 */
describe('UiButtonComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [UiButtonComponent],
      providers: translationProviders,
    });
    flushTranslation({ 'actions.save': 'Save' });
  });

  const render = (inputs: Record<string, unknown> = {}) => {
    const fixture = TestBed.createComponent(UiButtonComponent);
    fixture.componentRef.setInput('labelKey', 'actions.save');
    for (const [name, value] of Object.entries(inputs)) {
      fixture.componentRef.setInput(name, value);
    }
    fixture.detectChanges();
    return fixture;
  };

  it('renders the translated label rather than the key', () => {
    const button = render().nativeElement.querySelector(
      'button',
    ) as HTMLButtonElement;
    expect(button.textContent).toContain('Save');
  });

  it('disables and announces itself while loading', () => {
    const button = render({ loading: true }).nativeElement.querySelector(
      'button',
    ) as HTMLButtonElement;

    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');
  });

  it('emits nothing while loading, so a slow action cannot be double-submitted', () => {
    const fixture = render({ loading: true });
    const clicked = vi.fn();
    fixture.componentInstance.clicked.subscribe(clicked);

    (
      fixture.nativeElement.querySelector('button') as HTMLButtonElement
    ).click();

    expect(clicked).not.toHaveBeenCalled();
  });

  it('mirrors its icon in a right-to-left language', () => {
    TestBed.inject(LanguageStore).setLanguage('ar');
    const fixture = render({ icon: 'arrow-forward' });

    const icon = (fixture.nativeElement as HTMLElement).querySelector(
      '.crm-icon',
    );
    expect(icon?.classList.contains('crm-icon--mirrored')).toBe(true);
  });
});
