import { Pipe, PipeTransform } from '@angular/core';
import type { ValidationErrors } from '@angular/forms';

/**
 * Maps Angular validation errors to translation keys, so validation messages are
 * translated like everything else rather than hard-coded per form.
 */
@Pipe({ name: 'validationMessage', standalone: true })
export class ValidationMessagePipe implements PipeTransform {
  transform(errors: ValidationErrors | null): string | null {
    if (!errors) {
      return null;
    }
    const [first] = Object.keys(errors);
    return first ? `validation.${first}` : null;
  }
}
