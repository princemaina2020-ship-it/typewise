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
/**
 * Competitive lesson score. Accuracy strongly gates speed, while consistency
 * rewards controlled rhythm: WPM × 100 × accuracy × (0.75 + consistency / 400).
 */
export function lessonPerformance(
  wpm: number,
  accuracy: number,
  consistency: number,
) {
  // Scores remain comparable even when a browser or input method emits an
  // impossible burst of characters in a single event.
  const verifiedWpm = Math.min(Math.max(wpm, 0), 150);
  const score = Math.max(
    0,
    Math.round(
      verifiedWpm * 100 * (accuracy / 100) * (0.75 + consistency / 400),
    ),
  );
  return {
    score,
    stars: Math.max(1, Math.min(6, Math.ceil(score / 1500))),
  };
}
export type LessonRecordData = {
  attempts: number;
  bestScore: number;
  bestWpm: number;
  bestAccuracy: number;
  bestConsistency: number;
  bestDuration: number;
  lastScore: number;
  lastWpm: number;
  lastAccuracy: number;
  lastDuration: number;
};

export function updateLessonRecord(
  previous: LessonRecordData | undefined,
  current: {
    score: number;
    wpm: number;
    accuracy: number;
    consistency: number;
    duration: number;
  },
) {
  const isRecord = current.score > (previous?.bestScore || 0);
  return {
    isRecord,
    record: {
      attempts: (previous?.attempts || 0) + 1,
      bestScore: isRecord ? current.score : previous?.bestScore || 0,
      bestWpm: isRecord ? current.wpm : previous?.bestWpm || 0,
      bestAccuracy: isRecord ? current.accuracy : previous?.bestAccuracy || 0,
      bestConsistency: isRecord
        ? current.consistency
        : previous?.bestConsistency || 0,
      bestDuration: isRecord ? current.duration : previous?.bestDuration || 0,
      lastScore: current.score,
      lastWpm: current.wpm,
      lastAccuracy: current.accuracy,
      lastDuration: current.duration,
    },
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
