import { describe, expect, it } from 'vitest';
import { detectDirection } from './detect-direction';

describe('detectDirection', () => {
  it('detects Arabic text as rtl', () => {
    expect(detectDirection('مرحبا، لدي مشكلة في الطلب')).toBe('rtl');
  });

  it('detects English text as ltr', () => {
    expect(detectDirection('Hello, I have an issue with my order')).toBe('ltr');
  });

  it('detects Hebrew text as rtl', () => {
    expect(detectDirection('שלום, יש לי בעיה בהזמנה')).toBe('rtl');
  });

  it('uses the first strong character, ignoring leading punctuation and digits', () => {
    expect(detectDirection('  "123 — مرحبا')).toBe('rtl');
    expect(detectDirection('  "123 — Hello')).toBe('ltr');
  });

  it('falls back to ltr for text with no strong characters', () => {
    expect(detectDirection('12345 !!! ???')).toBe('ltr');
    expect(detectDirection('')).toBe('ltr');
  });
});
