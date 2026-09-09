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
test('detects weak keys', () =>
  assert.equal(
    detectWeakKeys({ R: { presses: 10, correct: 6, totalResponseMs: 3000 } })[0]
      .key,
    'R',
  ));
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
  assert.equal(lessonPerformance(400, 100, 100).score, 15000);
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
