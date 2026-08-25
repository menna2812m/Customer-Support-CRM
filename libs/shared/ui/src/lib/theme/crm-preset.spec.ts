import Aura from '@primeuix/themes/aura';
import { CrmPreset } from './crm-preset';

/**
 * The preset exists so that theming happens in one place. If a colour were ever
 * inlined here, or a ramp step left pointing at an Aura primitive, the tokens
 * would stop being the single source and nobody would notice until the brand
 * arrived. Both failure modes are asserted rather than assumed (spec 9.4).
 */
describe('CrmPreset', () => {
  const semantic = CrmPreset.semantic as Record<string, Record<string, string>>;
  const primitive = CrmPreset.primitive as Record<string, Record<string, string>>;

  function colorValues(value: unknown): string[] {
    if (typeof value === 'string') {
      return [value];
    }
    if (value && typeof value === 'object') {
      return Object.values(value as Record<string, unknown>).flatMap(colorValues);
    }
    return [];
  }

  it('drives the primary role colours from tokens', () => {
    expect(semantic['primary']['color']).toBe('var(--crm-color-primary)');
    expect(semantic['primary']['contrastColor']).toBe('var(--crm-color-primary-contrast)');
    expect(semantic['text']['color']).toBe('var(--crm-color-text)');
    expect(semantic['text']['mutedColor']).toBe('var(--crm-color-text-muted)');
    expect(semantic['focusRing']['color']).toBe('var(--crm-color-focus-ring)');
  });

  it('drives the radius scale from tokens', () => {
    expect(primitive['borderRadius']).toMatchObject({
      sm: 'var(--crm-radius-sm)',
      md: 'var(--crm-radius-md)',
      lg: 'var(--crm-radius-lg)',
    });
  });

  it('lets PrimeNG components inherit the language-specific leading', () => {
    // Arabic and Latin have different line heights; a fixed ratio here would
    // override styles/_typography.scss inside every vendor component.
    expect(semantic['typography']['lineHeight']).toBe('inherit');
  });

  describe.each(['primary', 'surface'])('the %s ramp', (ramp) => {
    const steps = Object.keys(Aura.semantic[ramp] as Record<string, string>).filter((key) =>
      /^\d+$/.test(key),
    );

    it('remaps every step Aura defines, leaving no primitive palette reference', () => {
      expect(steps.length).toBeGreaterThan(0);

      for (const step of steps) {
        expect(semantic[ramp][step]).toBeDefined();
      }

      expect(colorValues(semantic[ramp]).filter((value) => /\{[a-z]+\.\d+\}/.test(value))).toEqual(
        [],
      );
    });

    it('resolves every step through a token rather than a literal colour', () => {
      for (const step of steps) {
        expect(semantic[ramp][step]).toContain('var(--crm-color-');
        expect(semantic[ramp][step]).not.toMatch(/#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(/i);
      }
    });
  });
});
