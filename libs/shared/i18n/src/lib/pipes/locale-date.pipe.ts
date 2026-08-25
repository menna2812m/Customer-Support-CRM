import { inject, Pipe, PipeTransform } from '@angular/core';
import { LocaleFormatService } from '../locale-format.service';

/**
 * `pure: false`: the formatted output depends on `LanguageStore`'s signal, not
 * just this pipe's own input, so it must re-run on every change-detection pass
 * to follow a runtime language switch instead of caching a stale result.
 */
@Pipe({ name: 'localeDate', standalone: true, pure: false })
export class LocaleDatePipe implements PipeTransform {
  private readonly format = inject(LocaleFormatService);

  transform(value: string | Date, options?: Intl.DateTimeFormatOptions): string {
    return this.format.date(value, options);
  }
}
