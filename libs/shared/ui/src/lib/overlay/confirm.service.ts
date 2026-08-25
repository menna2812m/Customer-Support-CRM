import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Injectable,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';
import { UiButtonComponent } from '../button/ui-button.component';
import { DialogService } from './dialog.service';

export interface ConfirmOptions {
  readonly titleKey: string;
  readonly messageKey: string;
  readonly confirmKey?: string;
  readonly cancelKey?: string;
  readonly danger?: boolean;
}

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe, UiButtonComponent],
  template: `
    <div class="crm-confirm" role="alertdialog" aria-modal="true">
      <h2>{{ data.titleKey | transloco }}</h2>
      <p>{{ data.messageKey | transloco }}</p>
      <div class="crm-confirm__actions">
        <crm-button
          [labelKey]="data.cancelKey ?? 'actions.cancel'"
          variant="secondary"
          (clicked)="ref.close(false)"
        />
        <crm-button
          [labelKey]="data.confirmKey ?? 'actions.confirm'"
          [variant]="data.danger ? 'danger' : 'primary'"
          (clicked)="ref.close(true)"
        />
      </div>
    </div>
  `,
  styles: `
    .crm-confirm {
      max-inline-size: 28rem;
      padding: var(--crm-space-6);
      background: var(--crm-color-surface);
      border-radius: var(--crm-radius-lg);
      box-shadow: var(--crm-elevation-2);
    }

    .crm-confirm__actions {
      display: flex;
      gap: var(--crm-space-2);
      justify-content: flex-end;
      margin-block-start: var(--crm-space-6);
    }
  `,
})
export class ConfirmDialogComponent {
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);
  protected readonly data = inject<ConfirmOptions>(DIALOG_DATA);
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly dialogs = inject(DialogService);

  async confirm(options: ConfirmOptions): Promise<boolean> {
    const result = await firstValueFrom(
      this.dialogs.open<boolean, ConfirmOptions>(
        ConfirmDialogComponent,
        options,
      ),
    );
    return result === true;
  }
}
