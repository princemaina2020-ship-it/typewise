# Typewise

Typewise is a keyboard-first touch-typing platform with timed tests, 100 progressive lessons, per-key analysis, adaptive drills, analytics, 50 achievements, XP, levels, daily goals, streaks, leaderboards, guest persistence, and light/dark themes.

## Stack

React 19, TypeScript, Vinext, Tailwind CSS, Lucide, Drizzle ORM, Cloudflare D1, and OpenAI Sites. Guest progress is stored locally; the relational schema supports authenticated hosted persistence.

## Run and verify

```bash
npm install
npm run dev
npm test
npm run lint
npm run build
npm run db:generate
```

No environment variables are required for guest mode. D1 is provisioned by OpenAI Sites in production.

## Architecture

- `app/` — routes, metadata, responsive design system
- `lib/typing/` — pure typing, XP, streak, and weak-key algorithms
- `lib/data.ts` — original course, achievements, passages, keyboard map, brand
- `db/schema.ts` — production relational model and indexes
- `components/ui/` — reusable accessible primitives
- `tests/` — core logic tests

WPM is `(correct characters / 5) / elapsed minutes`; raw WPM includes every entered character. Accuracy is correct divided by entered characters. Consistency uses sampled-speed variation. Smart Practice ranks keys from error rate (70%) and normalized response latency (30%), then generates a targeted drill. Level XP requirements grow by 45 XP per level.

The D1 schema includes users, profiles, sessions, key statistics, lesson progress, achievements, daily goals, and immutable XP transactions, with ownership links and query-oriented indexes.

The full guest learning loop is implemented. Multi-device account sync, email recovery, editable admin content, server-verified competitive submissions, notifications, and billing are planned server-side extensions; core practice remains free.
