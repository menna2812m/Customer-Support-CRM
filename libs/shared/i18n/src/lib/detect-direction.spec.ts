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

  // Fix round 1: an Arabic-Indic digit, an Arabic combining mark, and Arabic
  // punctuation are all weak/neutral in the bidi algorithm - they must be
  // skipped exactly like their ASCII counterparts, not treated as strong-RTL
  // just because they live inside an RTL Unicode block.
  it('treats an Arabic-Indic digit as weak, not strong', () => {
    expect(detectDirection('\u0663 Hello')).toBe('ltr');
  });

  it('treats an Arabic combining mark (fatha) as weak, not strong', () => {
    expect(detectDirection('\u064e Hello')).toBe('ltr');
  });

  it('treats Arabic comma as neutral, not strong', () => {
    expect(detectDirection('\u060c Hello')).toBe('ltr');
  });

  it('treats Hebrew niqqud as weak, not strong', () => {
    expect(detectDirection('\u05b0 Hello')).toBe('ltr');
  });

  it('skips a leading Arabic-Indic digit and finds the Arabic letter after it', () => {
    expect(detectDirection('\u0663 \u0645\u0631\u062d\u0628\u0627')).toBe('rtl');
  });

  it('classifies a presentation-forms Arabic letter as rtl', () => {
    // U+FEFC ARABIC LIGATURE LAM WITH ALEF FINAL FORM
    expect(detectDirection('\ufefc')).toBe('rtl');
  });

  // Symmetric check on the LTR side: a combining diacritic is weak in Latin
  // text too, so it must not be picked up as a strong character before the
  // real first-strong Latin letter.
  it('treats a Latin combining diacritic as weak, not strong', () => {
    // U+0301 COMBINING ACUTE ACCENT
    expect(detectDirection('\u0301 Hello')).toBe('ltr');
  });
});
