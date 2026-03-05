#!/usr/bin/env node
/**
 * RSS Digest formatter for OpenClaw.
 *
 * Pulls items via rss.js (JSON), ranks by keyword interests, and prints a
 * Telegram-friendly digest.
 */

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const RSS_JS = path.join(__dirname, 'rss.js');
const DATA_DIR = path.join(__dirname, '..', 'data');
const STATE_FILE_SCHEDULED = path.join(DATA_DIR, 'digest-state.scheduled.json');

function parseArgs(argv) {
  const out = {
    // "scheduled" uses a state file so each run covers items since last run.
    // "ondemand" uses a fixed lookback window and does NOT update state.
    mode: 'scheduled',
    fallbackSince: '24h',
    limit: 10,
    // Diversity caps
    maxPerFeed: 3,
    maxPerFeedMacRumors: 2,
    keywords: '',
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--mode' && argv[i + 1]) out.mode = argv[++i];
    else if (a === '--fallback-since' && argv[i + 1]) out.fallbackSince = argv[++i];
    else if (a === '--limit' && argv[i + 1]) out.limit = Number(argv[++i]);
    else if (a === '--max-per-feed' && argv[i + 1]) out.maxPerFeed = Number(argv[++i]);
    else if (a === '--max-per-feed-macrumors' && argv[i + 1]) out.maxPerFeedMacRumors = Number(argv[++i]);
    else if (a === '--keywords' && argv[i + 1]) out.keywords = argv[++i];
  }
  return out;
}

function parseSinceToDate(since) {
  const match = String(since || '').match(/^(\d+)(h|d)$/);
  if (!match) return null;
  const [, num, unit] = match;
  const d = new Date();
  if (unit === 'h') d.setHours(d.getHours() - parseInt(num, 10));
  if (unit === 'd') d.setDate(d.getDate() - parseInt(num, 10));
  return d;
}

function loadLastRun() {
  try {
    if (fs.existsSync(STATE_FILE_SCHEDULED)) {
      const j = JSON.parse(fs.readFileSync(STATE_FILE_SCHEDULED, 'utf8'));
      if (j && j.lastRunAt) return new Date(j.lastRunAt);
    }
  } catch {}
  return null;
}

function saveLastRun(d) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(STATE_FILE_SCHEDULED, JSON.stringify({ lastRunAt: d.toISOString() }, null, 2));
  } catch {}
}

function runRssCheck({ keywords }) {
  const args = [RSS_JS, 'check', '--format', 'json'];
  if (keywords) args.push('--keywords', keywords);

  const res = spawnSync(process.execPath, args, { encoding: 'utf8' });
  if (res.error) throw res.error;
  if (res.status !== 0) {
    throw new Error(res.stderr || res.stdout || `rss.js exited ${res.status}`);
  }

  // rss.js writes only JSON when --format json
  return JSON.parse(res.stdout || '[]');
}

function tokenize(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9äöå\s-]/gi, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function scoreItem(item, kwList) {
  const text = `${item.title || ''} ${item.description || ''} ${item.feedName || ''} ${item.category || ''}`;
  const lc = text.toLowerCase();

  let score = 0;
  for (const kw of kwList) {
    if (!kw) continue;
    if (lc.includes(kw)) score += 5;
  }

  // Light boosts based on category naming
  const cat = (item.category || '').toLowerCase();
  if (cat.includes('ai')) score += 2;
  if (cat.includes('tech')) score += 1;
  if (cat.includes('fin')) score += 1;
  if (cat.includes('apple')) score += 1;
  if (cat.includes('gaming')) score += 1;

  // Freshness boost: newer items slightly higher
  const ageHours = (Date.now() - new Date(item.date).getTime()) / 36e5;
  if (Number.isFinite(ageHours)) score += Math.max(0, 4 - Math.min(4, ageHours / 6));

  return score;
}

function twoLineBlurb(desc) {
  const s = String(desc || '').replace(/\s+/g, ' ').trim();
  if (!s) return '';
  // Keep it short, ~220 chars.
  const clipped = s.length > 260 ? s.slice(0, 257).replace(/\s+\S*$/, '') + '…' : s;
  // Make it 2-ish lines by inserting a line break near the middle if long.
  if (clipped.length > 160) {
    const mid = Math.floor(clipped.length / 2);
    const left = clipped.slice(0, mid);
    const breakAt = left.lastIndexOf(' ');
    if (breakAt > 60) return clipped.slice(0, breakAt) + "\n" + clipped.slice(breakAt + 1);
  }
  return clipped;
}

function isMacRumors(it) {
  const s = `${it.feedName || ''} ${it.link || ''}`.toLowerCase();
  return s.includes('macrumors');
}

function pickDiverseTop(items, limit, maxPerFeedDefault, maxPerFeedMacRumors) {
  if (!items.length) return [];

  const baseDefault = Math.max(1, Number(maxPerFeedDefault) || 3);
  const baseMac = Math.max(1, Number(maxPerFeedMacRumors) || 2);

  // Try strict caps first; if we can't fill the limit, relax gradually.
  for (let relax = 0; relax <= 8; relax++) {
    const capDefault = baseDefault + relax;
    const capMac = baseMac + relax;

    const counts = new Map();
    const picked = [];

    for (const it of items) {
      const key = it.feedName || 'unknown';
      const n = counts.get(key) || 0;
      const cap = isMacRumors(it) ? capMac : capDefault;
      if (n >= cap) continue;
      counts.set(key, n + 1);
      picked.push(it);
      if (picked.length >= limit) return picked;
    }

    if (picked.length && relax >= 8) return picked;
  }

  return items.slice(0, limit);
}

function formatDigest(items, limit, maxPerFeedDefault = 3, maxPerFeedMacRumors = 2) {
  if (!items.length) return 'No new items found in your feeds for this window.';

  const top = pickDiverseTop(items, limit, maxPerFeedDefault, maxPerFeedMacRumors);

  const lines = [];
  lines.push(`RSS Digest — Top ${top.length}`);
  lines.push('');

  for (const it of top) {
    const cat = it.category ? `[${it.category}] ` : '';
    const source = it.feedName ? ` — ${it.feedName}` : '';
    lines.push(`${cat}*${it.title || 'Untitled'}*${source}`);

    const blurb = twoLineBlurb(it.description);
    if (blurb) lines.push(blurb);

    if (it.link) lines.push(it.link);
    lines.push('');
  }

  return lines.join('\n').trim();
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const defaultKeywords = [
    'ai', 'agent', 'agents', 'agentic', 'policy', 'social',
    'technology', 'cloud',
    'apple', 'mac', 'iphone', 'ipad',
    'finland', 'helsinki',
    'pc', 'steam', 'playstation', 'xbox', 'nintendo', 'gaming',
  ];

  const kw = (args.keywords ? args.keywords.split(',') : defaultKeywords)
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);

  const now = new Date();

  const items = runRssCheck({ keywords: '' }); // no pre-filter; we rank instead

  let windowStart = null;
  if (args.mode === 'scheduled') {
    windowStart = loadLastRun();
    if (!windowStart) windowStart = parseSinceToDate(args.fallbackSince);
  } else {
    windowStart = parseSinceToDate(args.fallbackSince);
  }

  const filtered = windowStart
    ? items.filter(it => new Date(it.date) > windowStart)
    : items;

  const ranked = filtered
    .map(it => ({ ...it, _score: scoreItem(it, kw) }))
    .sort((a, b) => (b._score - a._score) || (new Date(b.date) - new Date(a.date)));

  process.stdout.write(formatDigest(ranked, args.limit, args.maxPerFeed, args.maxPerFeedMacRumors) + '\n');

  if (args.mode === 'scheduled') saveLastRun(now);
}

main().catch(err => {
  console.error('Digest error:', err.message);
  process.exit(2);
});
