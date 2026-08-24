/**
 * First-strong-character detection for USER-GENERATED mixed-language content
 * (spec section 9.3): scans code points in order and returns the direction of
 * the first one that is strongly directional, skipping punctuation, digits,
 * whitespace, marks, and other direction-neutral or direction-weak characters.
 * Falls back to `ltr` when no strong character is found.
 *
 * Prefer `dir="auto"` in templates for this - it runs the same algorithm
 * natively for free. Use this function only where component logic genuinely
 * needs the computed direction value (e.g. choosing an icon or aligning an
 * adjacent control), not as the general mechanism for direction.
 *
 * All Unicode is expressed as `\uXXXX` / `\p{...}` escape *text*, never as
 * literal glyphs embedded in this file - a literal bidi-control character
 * sitting in source is a known "trojan source" hazard, and this is exactly
 * the file where one would hide.
 *
 * Fix round 1: a naive "is this code point inside an RTL Unicode block"
 * check is wrong, because those blocks also contain code points that are
 * weak or neutral in the bidi algorithm - Arabic-Indic digits (bidi class
 * `AN`), Arabic/Hebrew combining marks (`NSM`), and Arabic punctuation
 * (neutral). A digit or mark must be skipped exactly like its ASCII
 * counterpart, regardless of which script's block it happens to sit in.
 *
 * `STRONG_RTL` is therefore built as "script X AND general-category Letter"
 * for each RTL script, using the regex `v` flag's class-set intersection
 * (`&&`) - the clean, direct way to express that constraint. `\p{Script=X}`
 * alone is not enough (it also matches that script's digits/marks); the
 * `&&\p{Letter}` term is what excludes them. `v`-flag class syntax also lets
 * these per-script intersections be unioned together as nested classes
 * inside one outer class.
 *
 * TypeScript only allows the `v` regex flag on a *literal* when the
 * compilation target is es2024+ (this project targets es2022), so the
 * pattern is built as a `String.raw` template and handed to the `RegExp`
 * constructor instead of a `/.../v` literal - a plain runtime string is not
 * subject to that literal-syntax target check, and behaves identically.
 *
 * Script coverage: Arabic (covers the Arabic Presentation Forms too - their
 * Unicode Script property is still Arabic even though they're compatibility
 * code points, so a presentation-form Arabic letter still resolves `rtl`),
 * Hebrew (covers Hebrew presentation forms the same way), Syriac, Thaana,
 * and N'Ko. Plus the explicit RLM/RLE/RLO/RLI bidi formatting characters
 * (U+200F, U+202B, U+202E, U+2067), which are strong-RTL by definition but
 * are formatting characters rather than letters of any script, so the
 * script-intersection terms above cannot catch them - they are listed
 * individually instead.
 *
 * Hebrew is included deliberately: this is first-strong-character detection
 * for strong-directional characters in general, not an Arabic-only check,
 * and Hebrew shares the same bidi class ("R") as Arabic's ("AL").
 *
 * `STRONG_LTR` uses the Unicode `\p{Letter}` general-category property on
 * its own (no intersection needed): General_Category=Letter already
 * excludes every digit, mark, and punctuation character by definition, so
 * Latin/Cyrillic/Greek/CJK etc. digits or combining diacritics are correctly
 * skipped as weak, the same way Arabic-Indic digits and Arabic marks are on
 * the RTL side. Because `STRONG_RTL` is checked first per character,
 * Arabic/Hebrew/etc. letters - which are also `\p{Letter}` - are still
 * classified `rtl`, not `ltr`.
 */
const STRONG_RTL_PATTERN = String.raw`[[\p{Script=Arabic}&&\p{Letter}][\p{Script=Hebrew}&&\p{Letter}][\p{Script=Syriac}&&\p{Letter}][\p{Script=Thaana}&&\p{Letter}][\p{Script=Nko}&&\p{Letter}]\u200f\u202b\u202e\u2067]`;
const STRONG_RTL = new RegExp(STRONG_RTL_PATTERN, 'v');
const STRONG_LTR = new RegExp(String.raw`\p{Letter}`, 'u');

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
