import { Directionality } from '@angular/cdk/bidi';
import {
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
  provideAppInitializer,
} from '@angular/core';
import { AppDirectionality } from './app-directionality';
import { DirectionService } from './direction.service';

/**
 * Wires `AppDirectionality` in as the CDK `Directionality` implementation and
 * starts `DirectionService` at app bootstrap, so document `lang`/`dir` and the
 * CDK direction stream are synchronized from the first render (spec section 9.3).
 */
export function provideAppDirection(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: Directionality, useExisting: AppDirectionality },
    provideAppInitializer(() => inject(DirectionService).start()),
  ]);
}
