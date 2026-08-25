import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

@Component({
  selector: 'crm-loading-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="crm-skeleton" role="status" [attr.aria-busy]="true">
      @for (row of rowList(); track row) {
        <div class="crm-skeleton__row"></div>
      }
    </div>
  `,
  styles: `
    .crm-skeleton {
      display: flex;
      flex-direction: column;
      gap: var(--crm-space-2);
      padding: var(--crm-space-4);
    }

    .crm-skeleton__row {
      block-size: 1rem;
      background: var(--crm-color-surface-sunken);
      border-radius: var(--crm-radius-sm);
    }
  `,
})
export class LoadingSkeletonComponent {
  readonly rows = input(3);
  protected readonly rowList = computed(() =>
    Array.from({ length: this.rows() }, (_, index) => index),
  );
}
