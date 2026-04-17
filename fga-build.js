#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════
// FGA BUILD — Single Source of Truth Propagator
// ═══════════════════════════════════════════════════════════════════
// Reads fga-truths.json, scans all HTML/JS files for data-fga="key"
// attributes, and replaces inner text with the canonical value.
//
// Usage:
//   node fga-build.js           # propagate all truths
//   node fga-build.js --dry-run # preview changes without writing
//   node fga-build.js --diff    # show what would change
//
// How to tag HTML:
//   <span data-fga="pricing.guide_price">$197</span>
//   <div data-fga="costs.traditional_total">$268K+</div>
//
// The build replaces the INNER TEXT of the tagged element.
// Nested HTML inside the element is preserved if the value is text-only.
// ═══════════════════════════════════════════════════════════════════

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, resolve } from 'path';

const ROOT = resolve(import.meta.dirname || '.');
const TRUTHS_FILE = join(ROOT, 'fga-truths.json');
const DRY_RUN = process.argv.includes('--dry-run');
const SHOW_DIFF = process.argv.includes('--diff');

// ── Load truths ──────────────────────────────────────────────────
function loadTruths() {
  const raw = JSON.parse(readFileSync(TRUTHS_FILE, 'utf-8'));
  const flat = {};

  // Flatten nested keys: { pricing: { guide_price: "$197" } } → "pricing.guide_price" = "$197"
  for (const [section, values] of Object.entries(raw)) {
    if (section === '_meta') continue;
    if (typeof values === 'object' && values !== null) {
      for (const [key, val] of Object.entries(values)) {
        flat[`${section}.${key}`] = String(val);
      }
    }
  }

  return flat;
}

// ── Collect target files ─────────────────────────────────────────
function collectFiles(dir, exts = ['.html', '.js']) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith('.') || entry === 'node_modules' || entry === 'fga-build.js') continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      files.push(...collectFiles(full, exts));
    } else if (exts.some(ext => entry.endsWith(ext))) {
      files.push(full);
    }
  }
  return files;
}

// ── Process one file ─────────────────────────────────────────────
// Matches: data-fga="key">...< (captures everything between > and next <)
// Handles self-closing-ish patterns and multi-attribute tags.
const TAG_RE = /data-fga="([^"]+)"([^>]*)>([^<]*)</g;

function processFile(filePath, truths) {
  const original = readFileSync(filePath, 'utf-8');
  let changed = 0;
  const diffs = [];

  const updated = original.replace(TAG_RE, (match, key, attrs, oldVal) => {
    const newVal = truths[key];
    if (newVal === undefined) {
      console.warn(`  ⚠  Unknown key "${key}" in ${filePath.replace(ROOT + '/', '')}`);
      return match;
    }
    if (oldVal.trim() === newVal.trim()) {
      return match; // already correct
    }
    changed++;
    diffs.push({ key, old: oldVal.trim(), new: newVal });
    return `data-fga="${key}"${attrs}>${newVal}<`;
  });

  if (changed > 0) {
    const rel = filePath.replace(ROOT + '/', '');
    console.log(`  ✓  ${rel} — ${changed} value${changed > 1 ? 's' : ''} updated`);
    if (SHOW_DIFF) {
      for (const d of diffs) {
        console.log(`      ${d.key}: "${d.old}" → "${d.new}"`);
      }
    }
    if (!DRY_RUN) {
      writeFileSync(filePath, updated, 'utf-8');
    }
  }

  return changed;
}

// ── Also handle the password gate var P="..." pattern ────────────
// The password is stored as: var P="fga2026" at the top of gated files.
function processPasswordGate(filePath, password) {
  const original = readFileSync(filePath, 'utf-8');
  const re = /var P="([^"]+)"/;
  const m = original.match(re);
  if (!m) return 0;
  if (m[1] === password) return 0;

  const updated = original.replace(re, `var P="${password}"`);
  const rel = filePath.replace(ROOT + '/', '');
  console.log(`  ✓  ${rel} — password gate updated ("${m[1]}" → "${password}")`);
  if (SHOW_DIFF) {
    console.log(`      brand.password: "${m[1]}" → "${password}"`);
  }
  if (!DRY_RUN) {
    writeFileSync(filePath, updated, 'utf-8');
  }
  return 1;
}

// ── Main ─────────────────────────────────────────────────────────
console.log('');
console.log('╔══════════════════════════════════════════════════╗');
console.log('║  FGA Build — Single Source of Truth Propagator   ║');
console.log('╚══════════════════════════════════════════════════╝');
console.log('');

if (DRY_RUN) console.log('  🔍  DRY RUN — no files will be modified\n');

const truths = loadTruths();
console.log(`  📋  Loaded ${Object.keys(truths).length} truth values from fga-truths.json\n`);

const files = collectFiles(ROOT);
let totalChanges = 0;

for (const f of files) {
  totalChanges += processFile(f, truths);
}

// Password gate sync
const password = truths['brand.password'];
if (password) {
  for (const f of files) {
    if (f.endsWith('.html')) {
      totalChanges += processPasswordGate(f, password);
    }
  }
}

console.log('');
if (totalChanges === 0) {
  console.log('  ✅  All values already in sync — nothing to update.');
} else if (DRY_RUN) {
  console.log(`  📝  ${totalChanges} change${totalChanges > 1 ? 's' : ''} would be made. Run without --dry-run to apply.`);
} else {
  console.log(`  ✅  ${totalChanges} value${totalChanges > 1 ? 's' : ''} propagated successfully.`);
}
console.log('');
