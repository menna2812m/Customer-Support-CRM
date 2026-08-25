import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

/**
 * The PrimeNG theme is generated FROM our tokens, so a token change propagates
 * to every vendor component without touching component code (spec section 9.4).
 *
 * Aura addresses colour through two ramps — `primary.50…950` and
 * `surface.0…950` — which its components reference several hundred times. Only
 * remapping the handful of role keys (`primary.color`, `text.color`, …) would
 * leave every one of those references resolving to Aura's own emerald and
 * slate primitives, so both ramps are remapped in full. Our token set holds one
 * value per role rather than a ramp, so the intermediate steps are derived from
 * those roles with `color-mix` — the brand is still defined in exactly one
 * place, `styles/_tokens.scss`.
 *
 * Aura v3 expresses light and dark with the CSS `light-dark()` function rather
 * than a `colorScheme` block. We emit plain `var(--crm-*)` references, so a
 * future dark mode is a second set of token values under the `.crm-dark`
 * selector configured in `provideCrmTheme` — again, no component change.
 */
export const CrmPreset = definePreset(Aura, {
  primitive: {
    borderRadius: {
      sm: 'var(--crm-radius-sm)',
      md: 'var(--crm-radius-md)',
      lg: 'var(--crm-radius-lg)',
    },
  },
  semantic: {
    typography: {
      // 'inherit', not a fixed ratio: Arabic and Latin carry different leading
      // (styles/_typography.scss), and a hard-coded value here would override
      // it inside every PrimeNG component.
      lineHeight: 'inherit',
      fontSize: 'var(--crm-font-size-sm)',
    },
    primary: {
      // Tints run toward the page surface, shades toward the text colour.
      50: 'color-mix(in srgb, var(--crm-color-primary) 8%, var(--crm-color-surface))',
      100: 'color-mix(in srgb, var(--crm-color-primary) 14%, var(--crm-color-surface))',
      200: 'color-mix(in srgb, var(--crm-color-primary) 26%, var(--crm-color-surface))',
      300: 'color-mix(in srgb, var(--crm-color-primary) 44%, var(--crm-color-surface))',
      400: 'color-mix(in srgb, var(--crm-color-primary) 68%, var(--crm-color-surface))',
      500: 'var(--crm-color-primary)',
      600: 'color-mix(in srgb, var(--crm-color-primary) 86%, var(--crm-color-text))',
      700: 'color-mix(in srgb, var(--crm-color-primary) 72%, var(--crm-color-text))',
      800: 'color-mix(in srgb, var(--crm-color-primary) 58%, var(--crm-color-text))',
      900: 'color-mix(in srgb, var(--crm-color-primary) 44%, var(--crm-color-text))',
      950: 'color-mix(in srgb, var(--crm-color-primary) 30%, var(--crm-color-text))',
      color: 'var(--crm-color-primary)',
      contrastColor: 'var(--crm-color-primary-contrast)',
      hoverColor: 'color-mix(in srgb, var(--crm-color-primary) 86%, var(--crm-color-text))',
      activeColor: 'color-mix(in srgb, var(--crm-color-primary) 72%, var(--crm-color-text))',
    },
    surface: {
      0: 'var(--crm-color-surface)',
      50: 'var(--crm-color-surface-raised)',
      100: 'var(--crm-color-surface-sunken)',
      200: 'var(--crm-color-border)',
      300: 'color-mix(in srgb, var(--crm-color-border) 65%, var(--crm-color-text-muted))',
      400: 'color-mix(in srgb, var(--crm-color-border) 30%, var(--crm-color-text-muted))',
      500: 'var(--crm-color-text-muted)',
      600: 'color-mix(in srgb, var(--crm-color-text-muted) 55%, var(--crm-color-text))',
      // 700 upward is the text end of the ramp. Aura reaches for 800–950 only
      // as dark-scheme backgrounds, which no token set defines yet.
      700: 'var(--crm-color-text)',
      800: 'var(--crm-color-text)',
      900: 'var(--crm-color-text)',
      950: 'var(--crm-color-text)',
    },
    text: {
      color: 'var(--crm-color-text)',
      hoverColor: 'var(--crm-color-text)',
      mutedColor: 'var(--crm-color-text-muted)',
      hoverMutedColor: 'var(--crm-color-text-muted)',
    },
    focusRing: {
      width: '2px',
      style: 'solid',
      color: 'var(--crm-color-focus-ring)',
      offset: '2px',
    },
    content: {
      borderColor: 'var(--crm-color-border)',
    },
    formField: {
      borderColor: 'var(--crm-color-border)',
    },
  },
});
