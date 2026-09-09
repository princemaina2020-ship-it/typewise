export type TypingMetrics = {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  errors: number;
  correct: number;
  incorrect: number;
  consistency: number;
  cpm: number;
  words: number;
};
/** Industry convention: five correct characters equal one word. */
export function calculateMetrics(
  target: string,
  typed: string,
  elapsedMs: number,
  samples: number[] = [],
): TypingMetrics {
  let correct = 0;
  for (let i = 0; i < typed.length; i++) if (typed[i] === target[i]) correct++;
  const incorrect = typed.length - correct,
    minutes = Math.max(elapsedMs / 60000, 1 / 60000),
    mean = samples.length
      ? samples.reduce((a, b) => a + b, 0) / samples.length
      : 0;
  const deviation = samples.length
    ? Math.sqrt(
        samples.reduce((sum, n) => sum + (n - mean) ** 2, 0) / samples.length,
      )
    : 0;
  return {
    wpm: Math.round(correct / 5 / minutes),
    rawWpm: Math.round(typed.length / 5 / minutes),
    accuracy: typed.length
      ? Math.round((correct / typed.length) * 1000) / 10
      : 100,
    errors: incorrect,
    correct,
    incorrect,
    consistency: mean
      ? Math.max(0, Math.round((1 - deviation / mean) * 100))
      : 100,
    cpm: Math.round(correct / minutes),
    words: Math.floor(correct / 5),
  };
}
export type KeyPerformance = Record<
  string,
  { presses: number; correct: number; totalResponseMs: number }
>;
export function detectWeakKeys(stats: KeyPerformance, limit = 3) {
  return Object.entries(stats)
    .map(([key, v]) => {
      const accuracy = v.presses ? v.correct / v.presses : 1,
        response = v.presses ? v.totalResponseMs / v.presses : 0;
      return {
        key,
        accuracy: Math.round(accuracy * 100),
        response: Math.round(response),
        score: (1 - accuracy) * 0.7 + Math.min(response / 600, 1) * 0.3,
      };
    })
    .filter((x) => x.accuracy < 96 || x.response > 240)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
export function xpForSession(wpm: number, accuracy: number, seconds: number) {
  return Math.max(
    10,
    Math.round(seconds / 3 + wpm * 0.35 + Math.max(0, accuracy - 80) * 1.5),
  );
}
/** Lesson score: accuracy 65%, consistency 20%, speed 15% (capped at 60 WPM). */
export function lessonPerformance(
  wpm: number,
  accuracy: number,
  consistency: number,
) {
  const score = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        accuracy * 0.65 + consistency * 0.2 + Math.min(wpm / 60, 1) * 15,
      ),
    ),
  );
  return {
    score,
    stars: Math.max(1, Math.min(6, Math.ceil(score / (100 / 6)))),
  };
}
export function levelFromXp(xp: number) {
  let level = 1,
    spent = 0;
  while (level < 100) {
    const needed = 180 + level * 45;
    if (spent + needed > xp) break;
    spent += needed;
    level++;
  }
  const needed = 180 + level * 45;
  const title =
    level >= 100
      ? 'Keyboard Legend'
      : level >= 75
        ? 'Master Typist'
        : level >= 50
          ? 'Advanced Typist'
          : level >= 25
            ? 'Skilled Typist'
            : level >= 10
              ? 'Apprentice'
              : 'Beginner';
  return { level, title, current: xp - spent, needed };
}
export function calculateStreak(days: string[], today = new Date()) {
  const unique = new Set(days);
  let streak = 0;
  const cursor = new Date(today);
  cursor.setUTCHours(0, 0, 0, 0);
  if (!unique.has(cursor.toISOString().slice(0, 10)))
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  while (unique.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}
