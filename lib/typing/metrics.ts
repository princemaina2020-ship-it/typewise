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
export type KeystrokeSummary = { total: number; correct: number };

/**
 * Standard typing convention: one normalized word is five characters,
 * including spaces. WPM uses correct final characters, raw WPM uses every
 * character attempt, and accuracy includes mistakes that were later corrected.
 */
export function calculateMetrics(
  target: string,
  typed: string,
  elapsedMs: number,
  samples: number[] = [],
  keystrokes?: KeystrokeSummary,
): TypingMetrics {
  let correct = 0;
  for (let i = 0; i < typed.length; i++) if (typed[i] === target[i]) correct++;
  const totalAttempts = Math.max(typed.length, keystrokes?.total || 0),
    correctAttempts = Math.min(
      totalAttempts,
      Math.max(0, keystrokes?.correct ?? correct),
    ),
    incorrect = totalAttempts - correctAttempts,
    minutes = Math.max(elapsedMs / 60000, 1 / 60000),
    validSamples = samples.filter(
      (sample) => Number.isFinite(sample) && sample >= 0,
    ),
    mean = validSamples.length
      ? validSamples.reduce((a, b) => a + b, 0) / validSamples.length
      : 0;
  const deviation = validSamples.length > 1
    ? Math.sqrt(
        validSamples.reduce((sum, n) => sum + (n - mean) ** 2, 0) /
          validSamples.length,
      )
    : 0;
  return {
    wpm: Math.round(correct / 5 / minutes),
    rawWpm: Math.round(totalAttempts / 5 / minutes),
    accuracy: totalAttempts
      ? Math.round((correctAttempts / totalAttempts) * 1000) / 10
      : 100,
    errors: incorrect,
    correct,
    incorrect,
    consistency: validSamples.length > 1 && mean
      ? Math.max(0, Math.round((1 - deviation / mean) * 100))
      : 100,
    cpm: Math.round(correct / minutes),
    words: Math.floor(correct / 5),
  };
}
export type KeyPerformance = Record<
  string,
  {
    presses: number;
    correct: number;
    totalResponseMs: number;
    timedPresses?: number;
  }
>;
export function detectWeakKeys(stats: KeyPerformance, limit = 3) {
  const eligible = Object.entries(stats).filter(([, value]) => value.presses >= 3),
    latencies = eligible
      .map(([, value]) => {
        const timed = value.timedPresses ?? value.presses;
        return timed ? value.totalResponseMs / timed : 0;
      })
      .filter((latency) => latency > 0)
      .sort((a, b) => a - b),
    baseline = latencies.length
      ? latencies[Math.floor(latencies.length / 2)]
      : 0;
  return eligible
    .map(([key, v]) => {
      const accuracy = v.presses ? v.correct / v.presses : 1,
        timed = v.timedPresses ?? v.presses,
        response = timed ? v.totalResponseMs / timed : 0,
        inaccurate = accuracy < 0.95,
        slow =
          timed >= 3 &&
          (response > 420 ||
            (baseline > 0 && response > Math.max(280, baseline * 1.35))),
        errorSeverity = Math.min(1, Math.max(0, (0.95 - accuracy) / 0.35)),
        slowSeverity = slow
          ? Math.min(1, Math.max(0, response / Math.max(baseline, 220) - 1) / 1.5)
          : 0,
        confidence = Math.min(1, v.presses / 12);
      return {
        key,
        accuracy: Math.round(accuracy * 1000) / 10,
        response: Math.round(response),
        score:
          (errorSeverity * 0.72 + slowSeverity * 0.28) *
          (0.65 + confidence * 0.35),
        recommendation:
          inaccurate && slow
            ? `Practice ${key} in short letter pairs—accuracy first, then pace.`
            : inaccurate
              ? `Slow down on ${key} and repeat clean ${key}-key combinations.`
              : `Drill transitions into ${key} with a light, even movement.`,
        isAccuracyIssue: inaccurate,
        isSpeedIssue: slow,
      };
    })
    .filter((item) => item.isAccuracyIssue || item.isSpeedIssue)
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
  const verifiedWpm = Math.min(Math.max(wpm, 0), 250),
    verifiedAccuracy = Math.min(Math.max(accuracy, 0), 100),
    verifiedConsistency = Math.min(Math.max(consistency, 0), 100);
  const score = Math.max(
    0,
    Math.round(
      verifiedWpm *
        100 *
        (verifiedAccuracy / 100) *
        (0.75 + verifiedConsistency / 400),
    ),
  ),
    scoreStars = score ? Math.min(6, Math.ceil(score / 1500)) : 0,
    accuracyCap =
      verifiedAccuracy >= 98
        ? 6
        : verifiedAccuracy >= 95
          ? 5
          : verifiedAccuracy >= 90
            ? 4
            : verifiedAccuracy >= 85
              ? 3
              : verifiedAccuracy >= 75
                ? 2
                : 1,
    consistencyCap =
      verifiedConsistency >= 85
        ? 6
        : verifiedConsistency >= 70
          ? 5
          : verifiedConsistency >= 55
            ? 4
            : 3;
  return {
    score,
    stars: Math.min(scoreStars, accuracyCap, consistencyCap),
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
