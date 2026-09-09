import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateMetrics,
  calculateStreak,
  detectWeakKeys,
  levelFromXp,
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
