import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  flushTranslation,
  translationProviders,
} from '../../testing/translation-harness';
import { ConfirmService } from './confirm.service';

/**
 * A confirmation that resolved truthy on dismissal would turn "press Escape"
 * into "yes, delete it", so the two paths that are NOT an explicit confirm are
 * what this pins down.
 */
@Component({ standalone: true, template: '' })
class HostComponent {}

describe('ConfirmService', () => {
  let confirmService: ConfirmService;
  let fixture: ReturnType<typeof TestBed.createComponent<HostComponent>>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: translationProviders,
    });
    flushTranslation({
      'tickets.delete.title': 'Delete ticket',
      'tickets.delete.message': 'This cannot be undone.',
      'actions.confirm': 'Confirm',
      'actions.cancel': 'Cancel',
    });

    confirmService = TestBed.inject(ConfirmService);
    // The CDK attaches the dialog to an overlay outside the fixture, but it
    // still needs an application with a running change detector.
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  const openConfirm = () =>
    confirmService.confirm({
      titleKey: 'tickets.delete.title',
      messageKey: 'tickets.delete.message',
      danger: true,
    });

  const click = (label: string) => {
    fixture.detectChanges();
    const button = Array.from(
      document.querySelectorAll<HTMLButtonElement>('.crm-confirm button'),
    ).find((candidate) => candidate.textContent?.includes(label));
    expect(button, `no button labelled "${label}"`).toBeDefined();
    button?.click();
    fixture.detectChanges();
  };

  it('resolves true only when the confirming action is used', async () => {
    const result = openConfirm();
    click('Confirm');
    await expect(result).resolves.toBe(true);
  });

  it('resolves false when the cancelling action is used', async () => {
    const result = openConfirm();
    click('Cancel');
    await expect(result).resolves.toBe(false);
  });

  it('resolves false when the dialog is dismissed without an answer', async () => {
    const result = openConfirm();
    fixture.detectChanges();

    // The CDK's overlay keyboard dispatcher listens on <body>, and it still
    // tests the legacy `keyCode`, which a constructed KeyboardEvent leaves 0.
    const escape = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
    });
    Object.defineProperty(escape, 'keyCode', { get: () => 27 });
    document.body.dispatchEvent(escape);
    fixture.detectChanges();

    await expect(result).resolves.toBe(false);
  });
});
