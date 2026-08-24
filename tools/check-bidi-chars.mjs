#!/usr/bin/env node
/**
 * Fails when any tracked file contains a Unicode bidirectional control
 * character - the "Trojan Source" pattern (a right-to-left/left-to-right
 * override or isolate that makes source code render one way to a human
 * reviewer and compile/execute another). One such character (U+202E) was
 * accidentally introduced into this repository during Task 7, via a
 * corrupted snippet copy/pasted from a plan document, and was caught only
 * by luck.
 *
 * Scans ALL files tracked by git - not just source-code extensions -
 * because the Task 7 contamination originated in a `.md` file; a scan
 * scoped to `.ts`/`.html` would have missed exactly the file that caused
 * the incident.
 *
 * Deliberately implemented as a small Node script rather than a shell
 * one-liner: `grep -P` (needed for `\x{...}` Unicode escapes) is not
 * reliably available across locales/environments, and this must run
 * portably under Git Bash on Windows.
 *
 * Flags exactly the invisible bidi control characters, not real RTL script
 * (Arabic/Hebrew letters are ordinary code points well outside these
 * ranges, so this repo's genuine Arabic translation strings are unaffected):
 *   - U+202A-U+202E  (LRE, RLE, PDF, LRO, RLO)
 *   - U+2066-U+2069  (LRI, RLI, FSI, PDI)
 *   - U+200E, U+200F (LRM, RLM)
 *   - U+061C         (ALM, Arabic Letter Mark)
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { extname } from 'node:path';

// Written as explicit \uXXXX escapes, deliberately, rather than the literal
// characters themselves - this file must not itself contain the very bidi
// control characters it exists to detect.
//
// Two forms of the same pattern: a non-global one for a cheap whole-file
// `.test()` short-circuit (a global regex's `.test()` is stateful across
// calls via `lastIndex`, which is easy to misuse), and a factory for a fresh
// global regex per line so every offending character on a line is reported,
// not just the first (`RegExp.prototype.exec` without `/g` always returns
// the same first match).
const BIDI_CONTROL_PATTERN = /[\u202A-\u202E\u2066-\u2069\u200E\u200F\u061C]/u;
const bidiControlPatternGlobal = () => /[\u202A-\u202E\u2066-\u2069\u200E\u200F\u061C]/gu;

// Extensions that are legitimately binary: scanning them wastes time and
// risks a coincidental byte sequence that happens to decode as one of the
// characters above. Everything else - including files with no extension,
// and every text format such as .md, .ts, .json, .html - is scanned.
const SKIPPED_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp', '.bmp',
  '.pdf', '.woff', '.woff2', '.ttf', '.otf', '.eot',
  '.zip', '.gz', '.tar', '.7z', '.rar',
  '.mp3', '.mp4', '.mov', '.avi', '.webm',
  '.wasm', '.exe', '.dll', '.so', '.dylib', '.bin',
]);

function listTrackedFiles() {
  const output = execFileSync('git', ['ls-files', '-z'], {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 128,
  });
  return output.split('\0').filter((path) => path.length > 0);
}

/**
 * Scans one tracked file. Returns `{ offenses, readError }`:
 *  - `offenses`: every bidi-control-character hit found, one entry per
 *    occurrence (not just the first per line).
 *  - `readError`: set when the file could not be read for any reason OTHER
 *    than it simply not existing in the working tree. `ENOENT` on a tracked
 *    path is a legitimate, if unusual, state (e.g. a sparse/partial
 *    checkout) and is skipped quietly. Anything else - permission denied, an
 *    I/O error, a path git thinks is a regular file but isn't - means a file
 *    that DOES exist could not be scanned. Silently skipping that would
 *    defeat the guard for exactly that file, so it is surfaced and made to
 *    fail the run instead.
 */
function scanFile(filePath) {
  let buffer;
  try {
    buffer = readFileSync(filePath);
  } catch (err) {
    if (err && err.code === 'ENOENT') {
      return { offenses: [], readError: null };
    }
    const detail = err && err.code ? err.code : String(err);
    return { offenses: [], readError: `${filePath}: could not be read (${detail})` };
  }

  const text = buffer.toString('utf8');
  if (!BIDI_CONTROL_PATTERN.test(text)) {
    return { offenses: [], readError: null };
  }

  const offenses = [];
  const lines = text.split(/\r\n|\r|\n/);
  lines.forEach((line, index) => {
    for (const match of line.matchAll(bidiControlPatternGlobal())) {
      const codePoint = match[0].codePointAt(0).toString(16).toUpperCase().padStart(4, '0');
      offenses.push(`${filePath}:${index + 1}: found U+${codePoint} (bidi control character)`);
    }
  });
  return { offenses, readError: null };
}

function main() {
  const trackedFiles = listTrackedFiles();

  // Zero tracked files is never a legitimately clean result: it means this
  // ran in the wrong working directory, against an uninitialized checkout,
  // or some other broken invocation - having verified nothing, not having
  // verified a clean repository. Fail loudly rather than reporting success.
  if (trackedFiles.length === 0) {
    console.error(
      'lint:bidi FAILED - `git ls-files` returned zero tracked files.\n\n' +
        'That means nothing was scanned, not that nothing was found. Likely causes: this was run ' +
        'outside the repository working tree, against an uninitialized/partial checkout, or some ' +
        'other broken invocation. Re-run from inside the repository you intend to scan.',
    );
    process.exitCode = 1;
    return;
  }

  const files = trackedFiles.filter((path) => !SKIPPED_EXTENSIONS.has(extname(path).toLowerCase()));

  const offenses = [];
  const readErrors = [];
  for (const file of files) {
    const result = scanFile(file);
    offenses.push(...result.offenses);
    if (result.readError) {
      readErrors.push(result.readError);
    }
  }

  if (readErrors.length > 0) {
    console.error('lint:bidi FAILED - could not read the following tracked file(s), so they could not be scanned:\n');
    for (const readError of readErrors) {
      console.error(`  ${readError}`);
    }
    console.error('\nA file this guard cannot read cannot be verified clean - fix the underlying access problem.');
  }

  if (offenses.length > 0) {
    console.error(
      (readErrors.length > 0 ? '\n' : '') +
        'lint:bidi FAILED - bidi control character(s) found (Trojan Source risk):\n',
    );
    for (const offense of offenses) {
      console.error(`  ${offense}`);
    }
    console.error(
      '\nThese are invisible directional-override/isolate characters, not legitimate Arabic or ' +
        'Hebrew script - remove them. See https://trojansource.codes/ for background.',
    );
  }

  if (readErrors.length > 0 || offenses.length > 0) {
    process.exitCode = 1;
    return;
  }

  console.log(`lint:bidi passed - checked ${files.length} tracked file(s), no bidi control characters found.`);
}

main();
