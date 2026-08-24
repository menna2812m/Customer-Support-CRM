/**
 * First-strong-character detection for USER-GENERATED mixed-language content
 * (spec section 9.3): scans code points in order and returns the direction of
 * the first one that is strongly directional, skipping punctuation, digits,
 * whitespace, and other direction-neutral characters. Falls back to `ltr`
 * when no strong character is found.
 *
 * Prefer `dir="auto"` in templates for this - it runs the same algorithm
 * natively for free. Use this function only where component logic genuinely
 * needs the computed direction value (e.g. choosing an icon or aligning an
 * adjacent control), not as the general mechanism for direction.
 *
 * Ranges below are explicit `\uXXXX` escapes, never literal Unicode glyphs,
 * so they stay reviewable as plain ASCII in source and never embed an actual
 * bidi-control character - literal RTL-override characters sitting in source
 * text are a known "trojan source" hazard, and bidi-control-character lint
 * rules reject them outright.
 *
 * Range coverage:
 *  - `STRONG_RTL` = U+0590-U+08FF (Hebrew, Arabic, Syriac, Arabic Supplement,
 *    Thaana, NKo, Samaritan, Mandaic, Syriac Supplement, Arabic Extended-A)
 *    + U+FB1D-U+FDFF (Hebrew presentation forms, Arabic Presentation
 *    Forms-A) + U+FE70-U+FEFF (Arabic Presentation Forms-B) + U+200F,
 *    U+202B, U+202E, U+2067 (RLM/RLE/RLO/RLI formatting characters). Hebrew
 *    is included deliberately: this is first-strong-character detection for
 *    strong-directional characters in general, not an Arabic-only check, and
 *    Hebrew shares the same bidi class ("R") as Arabic's ("AL").
 *  - `STRONG_LTR` uses the Unicode `\p{L}` letter property, so any letter
 *    not already matched by `STRONG_RTL` (Latin, Cyrillic, Greek, CJK, etc.)
 *    counts as strong-LTR. Because `STRONG_RTL` is checked first per
 *    character, Arabic/Hebrew letters - which are also `\p{L}` - are still
 *    classified as `rtl`.
 */
const STRONG_RTL =
  /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF\u200F\u202B\u202E\u2067]/u;
const STRONG_LTR = /\p{L}/u;

export function detectDirection(text: string): 'rtl' | 'ltr' {
  for (const character of text) {
    if (STRONG_RTL.test(character)) {
      return 'rtl';
    }
    if (STRONG_LTR.test(character)) {
      return 'ltr';
    }
  }
  return 'ltr';
}
