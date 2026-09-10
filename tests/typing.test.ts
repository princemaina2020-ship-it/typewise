import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateMetrics,
  calculateStreak,
  detectWeakKeys,
  levelFromXp,
  lessonPerformance,
  updateLessonRecord,
  xpForSession,
} from '../lib/typing/metrics.ts';
test('uses five correct characters per word', () =>
  assert.equal(calculateMetrics('hello', 'hello', 60000).wpm, 1));
test('calculates accuracy and errors', () => {
  const x = calculateMetrics('hello', 'hallo', 60000);
  assert.equal(x.accuracy, 80);
  assert.equal(x.errors, 1);
});
test('keeps corrected mistakes in accuracy and raw speed', () => {
  const x = calculateMetrics('hello', 'hello', 60000, [], {
    total: 6,
    correct: 5,
  });
  assert.equal(x.wpm, 1);
  assert.equal(x.rawWpm, 1);
  assert.equal(x.accuracy, 83.3);
  assert.equal(x.errors, 1);
});
test('consistency uses coefficient of variation across interval speeds', () => {
  assert.equal(calculateMetrics('', '', 1, [60, 60, 60]).consistency, 100);
  assert.equal(calculateMetrics('', '', 1, [30, 90]).consistency, 50);
  assert.equal(calculateMetrics('', '', 1, [Number.NaN]).consistency, 100);
});
test('detects weak keys', () =>
  assert.equal(
    detectWeakKeys({
      R: {
        presses: 10,
        correct: 6,
        totalResponseMs: 2700,
        timedPresses: 9,
      },
    })[0].key,
    'R',
  ));
test('weak-key analyzer needs evidence and detects unusually slow keys', () => {
  assert.deepEqual(
    detectWeakKeys({ Q: { presses: 2, correct: 0, totalResponseMs: 900 } }),
    [],
  );
  const weak = detectWeakKeys({
    A: {
      presses: 12,
      correct: 12,
      totalResponseMs: 1100,
      timedPresses: 11,
    },
    R: {
      presses: 12,
      correct: 12,
      totalResponseMs: 5500,
      timedPresses: 11,
    },
  });
  assert.equal(weak[0].key, 'R');
  assert.equal(weak[0].isSpeedIssue, true);
  assert.match(weak[0].recommendation, /transitions into R/i);
});
test('XP and levels increase safely', () => {
  assert.ok(xpForSession(60, 98, 30) > 0);
  assert.ok(levelFromXp(10000).level > 1);
});
test('streak counts consecutive dates', () =>
  assert.equal(
    calculateStreak(
      ['2026-09-07', '2026-09-08', '2026-09-09'],
      new Date('2026-09-09T12:00:00Z'),
    ),
    3,
  ));
test('lesson performance produces a score and six-star maximum', () => {
  assert.deepEqual(lessonPerformance(100, 100, 100), {
    score: 10000,
    stars: 6,
  });
  assert.equal(lessonPerformance(15, 80, 70).stars >= 1, true);
  assert.equal(lessonPerformance(400, 100, 100).score, 25000);
  assert.deepEqual(lessonPerformance(0, 100, 100), { score: 0, stars: 0 });
  assert.equal(lessonPerformance(120, 83, 90).stars, 2);
  assert.equal(lessonPerformance(120, 99, 40).stars, 3);
});

test('lesson records keep a personal best after a lower score', () => {
  const first = updateLessonRecord(undefined, {
    score: 6100,
    wpm: 51,
    accuracy: 98,
    consistency: 90,
    duration: 72,
  });
  const second = updateLessonRecord(first.record, {
    score: 6650,
    wpm: 56,
    accuracy: 99,
    consistency: 92,
    duration: 68,
  });
  const lower = updateLessonRecord(second.record, {
    score: 6200,
    wpm: 53,
    accuracy: 97,
    consistency: 86,
    duration: 71,
  });

  assert.equal(second.isRecord, true);
  assert.equal(lower.isRecord, false);
  assert.equal(lower.record.bestScore, 6650);
  assert.equal(lower.record.bestWpm, 56);
  assert.equal(lower.record.attempts, 3);
  assert.equal(lower.record.lastScore, 6200);
});
