---
name: rss-telegram-digest
version: 0.1.0
description: "RSS/Atom feed checker + prioritized digest (Top N) suitable for Telegram delivery."
metadata:
  openclaw:
    category: "productivity"
    requires:
      bins: ["node"]
---

# RSS Telegram Digest

Maintain a list of RSS/Atom feeds, check for new items, and produce a **prioritized Top N digest** formatted for Telegram.

This skill is self-contained (no external feed reader required). It stores config/state under `data/`.

## Files

- `data/feeds.json` — feed list + settings
- `data/digest-state.scheduled.json` — last scheduled run timestamp (used to only include new posts since last scheduled digest)
- `scripts/rss.js` — feed management + fetch/checker
- `scripts/digest.js` — ranking + digest formatter

## Common commands

### List configured feeds

```bash
node skills/rss-telegram-digest/scripts/rss.js list
```

### Add a feed

```bash
node skills/rss-telegram-digest/scripts/rss.js add "https://example.com/feed.xml" --category tech
```

### Check feeds (machine-readable JSON)

```bash
node skills/rss-telegram-digest/scripts/rss.js check --format json
```

### Generate a digest (scheduled mode: since last run)

```bash
node skills/rss-telegram-digest/scripts/digest.js --mode scheduled --fallback-since 24h --limit 10
```

- `--mode scheduled` updates the state file so the next scheduled digest only includes newer items.
- `--fallback-since 24h` is used on the very first run (or if the state file is missing).

### Generate a digest (on-demand mode: does not affect scheduled state)

```bash
node skills/rss-telegram-digest/scripts/digest.js --mode ondemand --fallback-since 24h --limit 10
```

## Ranking / prioritization

The digest ranks items using keyword matching across title + description + category + feed name.
Default interests include:

- AI / agents / agentic (incl. policy + social)
- technology, cloud
- Apple
- Finland
- PC/console gaming

If you want to override keywords per run:

```bash
node skills/rss-telegram-digest/scripts/digest.js --mode ondemand --fallback-since 24h --limit 10 --keywords "ai,agents,cloud,apple,finland,gaming"
```

## Scheduling (OpenClaw cron)

Example: run at **08:30 and 18:00 Europe/Helsinki** and deliver to the current Telegram chat.

```bash
openclaw cron add \
  --name "RSS Digest" \
  --description "Top 10 prioritized items from RSS feeds" \
  --cron "30 8,18 * * *" \
  --tz "Europe/Helsinki" \
  --channel telegram \
  --to "<TELEGRAM_CHAT_ID>" \
  --announce \
  --session isolated \
  --timeout-seconds 300 \
  --message "Create and send my RSS digest (Top 10). Run: node /home/admin/.openclaw/workspace/agent-skills/skills/rss-telegram-digest/scripts/digest.js --mode scheduled --fallback-since 24h --limit 10 and present the output."
```

## Safety notes

- This skill only fetches public RSS/Atom feeds over HTTP(S).
- It does not auto-mark items as read anywhere (it’s stateless other than last scheduled run time).
