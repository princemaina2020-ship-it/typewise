# Typewise

Typewise is a keyboard-first touch-typing platform with timed tests, 100 progressive lessons, per-key analysis, adaptive drills, analytics, 55 data-driven achievements, XP, levels, daily goals, streaks, leaderboards, guest persistence, and light/dark themes.

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
- `lib/data.ts` — original course, passages, keyboard map, and brand
- `lib/achievements.ts` — achievement catalog, eligibility, and progress rules
- `db/schema.ts` — production relational model and indexes
- `components/ui/` — reusable accessible primitives
- `tests/` — core logic tests

WPM is `(correct characters / 5) / elapsed minutes`; raw WPM includes every entered character. Accuracy is correct divided by entered characters. Consistency uses sampled-speed variation. Smart Practice ranks keys from error rate (70%) and normalized response latency (30%), then generates a targeted drill. Level XP requirements grow by 45 XP per level.

Lesson score is `round(WPM × 100 × accuracy/100 × (0.75 + consistency/400))`. Accuracy therefore directly gates the value of speed; a fast, error-heavy attempt cannot outrank controlled work. One star is awarded per 1,500 score points, capped at six. Every attempt is retained, while a `LessonBest` changes only when the new score is higher.

The D1 schema includes users, profiles, sessions, lesson attempts, per-lesson bests, key statistics, lesson progress, achievement definitions/unlocks, daily goals, and immutable XP transactions, with ownership links and query-oriented indexes.

The full guest learning loop is implemented. Multi-device account sync, email recovery, editable admin content, server-verified competitive submissions, notifications, and billing are planned server-side extensions; core practice remains free.
