import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  flushTranslation,
  translationProviders,
} from '../../testing/translation-harness';
import { FormFieldComponent } from './form-field.component';

@Component({
  standalone: true,
  imports: [FormFieldComponent, ReactiveFormsModule],
  template: `
    <crm-form-field labelKey="form.email" [control]="email">
      <input [formControl]="email" />
    </crm-form-field>
  `,
})
class HostComponent {
  readonly email = new FormControl('', [Validators.required, Validators.email]);
}

describe('FormFieldComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: translationProviders,
    });
    flushTranslation({
      'form.email': 'Email',
      'validation.required': 'This field is required',
      'validation.email': 'Enter a valid email address',
    });
  });

  const render = () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    return fixture;
  };

  it('renders the translated label', () => {
    const element = render().nativeElement as HTMLElement;
    expect(element.querySelector('label')?.textContent).toContain('Email');
  });

  it('shows no error while the control is untouched', () => {
    const element = render().nativeElement as HTMLElement;
    expect(element.querySelector('[data-testid="field-error"]')).toBeNull();
  });

  it('renders a translated message once the control is touched and invalid', () => {
    const fixture = render();
    fixture.componentInstance.email.markAsTouched();
    fixture.detectChanges();

    const error = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-testid="field-error"]',
    );
    expect(error?.textContent).toContain('This field is required');
  });

  it('maps each validation error to its own translated message', () => {
    const fixture = render();
    fixture.componentInstance.email.setValue('not-an-email');
    fixture.componentInstance.email.markAsTouched();
    fixture.detectChanges();

    const error = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-testid="field-error"]',
    );
    expect(error?.textContent).toContain('Enter a valid email address');
  });

  it('links the message to the control for assistive technology', () => {
    const fixture = render();
    fixture.componentInstance.email.markAsTouched();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const input = element.querySelector('input');
    const error = element.querySelector('[data-testid="field-error"]');
    expect(input?.getAttribute('aria-describedby')).toBe(error?.id);
    expect(input?.getAttribute('aria-invalid')).toBe('true');
  });
});
