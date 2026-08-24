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
const BIDI_CONTROL_PATTERN = /[\u202A-\u202E\u2066-\u2069\u200E\u200F\u061C]/u;

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

function findOffenses(filePath) {
  let buffer;
  try {
    buffer = readFileSync(filePath);
  } catch {
    // Tracked but unreadable in the working tree (e.g. a path git also
    // tracks as deleted, or a broken symlink) - nothing to scan.
    return [];
  }

  const text = buffer.toString('utf8');
  if (!BIDI_CONTROL_PATTERN.test(text)) {
    return [];
  }

  const offenses = [];
  const lines = text.split(/\r\n|\r|\n/);
  lines.forEach((line, index) => {
    const match = BIDI_CONTROL_PATTERN.exec(line);
    if (match) {
      const codePoint = match[0].codePointAt(0).toString(16).toUpperCase().padStart(4, '0');
      offenses.push(`${filePath}:${index + 1}: found U+${codePoint} (bidi control character)`);
    }
  });
  return offenses;
}

function main() {
  const files = listTrackedFiles().filter((path) => !SKIPPED_EXTENSIONS.has(extname(path).toLowerCase()));

  const offenses = files.flatMap(findOffenses);

  if (offenses.length > 0) {
    console.error('lint:bidi FAILED - bidi control character(s) found (Trojan Source risk):\n');
    for (const offense of offenses) {
      console.error(`  ${offense}`);
    }
    console.error(
      '\nThese are invisible directional-override/isolate characters, not legitimate Arabic or ' +
        'Hebrew script - remove them. See https://trojansource.codes/ for background.',
    );
    process.exitCode = 1;
    return;
  }

  console.log(`lint:bidi passed - checked ${files.length} tracked file(s), no bidi control characters found.`);
}

main();
