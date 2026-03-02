# Daily Tech Shortlist (Approval-First)

Curate 3–5 daily items aligned with my profile (cloud, engineering, tech leadership/delivery, AI) and produce ready-to-post Bluesky drafts. **Never auto-post**; posting happens only after explicit approval via Telegram.

## Profile / Voice

- Audience: engineers, tech leads, platform teams, delivery leaders, AI practitioners
- Tone: pragmatic, opinionated, anti-hype, critical thinking
- Language: English

## Hard Filters (Exclusions)

- No crypto / web3
- No consumer gadgets/reviews
- Avoid pure press-release rewrites unless there’s real technical/delivery impact

## Allowed / Encouraged Topics

- Cloud infrastructure, platform engineering, SRE, networking, security-by-design, cost, reliability
- Engineering leadership & delivery: org design, dev productivity, incident learning, transformation
- AI: LLM systems in production, evals, safety, tooling, applied ML, real-world constraints
- Policy/society/technology intersection: regulation, privacy, surveillance, labor impacts, procurement, education — when grounded in real technical/delivery implications

## Sources to Scan (daily)

Prefer RSS/APIs when available; otherwise fetch pages and extract titles + summaries.

1) Hacker News (front page)
   - API: https://hn.algolia.com/api/v1/search?tags=front_page
2) InfoQ (RSS preferred)
3) ACM Queue
4) Cloudflare Blog
5) Netflix TechBlog
6) AWS Architecture Blog
7) Google Cloud Blog (filter out shallow product announcements)
8) IEEE Spectrum
9) MIT Technology Review
10) DeepLearning.AI – The Batch
11) Papers with Code – trending
12) DeepMind blog / Google AI blog (primary sources; filter for substance)
13) Anthropic research/news (primary sources; filter for substance)
14) The Register (enterprise reality checks; outages; policy+tech)

## Selection Policy (3–5 items)

- Goal: **~50/50 split** between:
  - cloud/engineering/delivery items
  - AI items
- If a high-quality policy/society/tech item appears, it may replace one slot.

Ranking heuristics:
- Prefer primary sources (engineering blogs, research blogs) over reposts
- Prefer “teachable” content (clear takeaways) over hype
- Prefer posts that support a pragmatic, opinionated take
- Avoid duplicates covering the same announcement across sources

## Output Format (what to produce)

For each selected item:

1) **Title + link**
2) **2–3 bullet summary**
   - What it is
   - Why it matters
   - Practical implication / tradeoff / “what I’d do Monday”
3) **Bluesky-ready draft**
   - Target <= 300 characters if possible
   - If needed, propose a 2-post thread
   - Include link (on its own line if you want embed-friendly formatting)

End with:
> “Want me to post any of these? Reply with the item number(s) and any edits.”

## Approval-First Rules

- **Never post automatically**
- Only post after explicit confirmation (“post it”, “post #2”, “post items 1 and 4”)
- If a draft exceeds Bluesky’s limit, shorten or convert to thread before posting
- If the user requests edits, iterate until satisfied, then ask for confirmation again

## Telegram operator commands (suggested)

- `run now` → trigger scan immediately
- `skip tomorrow` → skip the next scheduled run only
- `change time to HH:MM` → reschedule the daily run (Europe/Helsinki)
- `add source <url or name>` → add a source
- `remove source <name>` → remove a source
