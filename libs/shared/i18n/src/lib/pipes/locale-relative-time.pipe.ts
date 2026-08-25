import { inject, Pipe, PipeTransform } from '@angular/core';
import { LocaleFormatService } from '../locale-format.service';

/**
 * `pure: false`: the formatted output depends on `LanguageStore`'s signal, not
 * just this pipe's own input, so it must re-run on every change-detection pass
 * to follow a runtime language switch instead of caching a stale result.
 */
@Pipe({ name: 'localeRelativeTime', standalone: true, pure: false })
export class LocaleRelativeTimePipe implements PipeTransform {
  private readonly format = inject(LocaleFormatService);

  transform(value: string | Date): string {
    return this.format.relativeTime(value);
  }
}
