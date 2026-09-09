import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateAchievements } from '../lib/achievements.ts';
const base = {
  sessions: [],
  completedLessons: [],
  streak: 0,
  recordBreaks: 0,
  bestLessonScore: 0,
};
test('speed achievements require a meaningful session', () => {
  const short = evaluateAchievements({
    ...base,
    sessions: [
      {
        wpm: 100,
        accuracy: 100,
        duration: 5,
        rawWpm: 100,
        errors: 0,
        mode: 'test',
      },
    ],
  });
  assert.equal(short.find((a) => a.id === 'wpm-100')?.unlocked, false);
});
test('achievement progress uses real lesson totals', () => {
  const list = evaluateAchievements({
    ...base,
    completedLessons: [1, 2, 3, 4, 5],
  });
  assert.equal(list.find((a) => a.id === 'lessons-5')?.unlocked, true);
  assert.equal(list.find((a) => a.id === 'home-row')?.unlocked, true);
});
test('perfect lesson achievements count only perfect lesson sessions', () => {
  const sessions = Array.from({ length: 3 }, (_, i) => ({
    wpm: 45 + i,
    accuracy: 100,
    duration: 25,
    rawWpm: 46 + i,
    errors: 0,
    mode: `Lesson ${i + 1}`,
  }));
  const list = evaluateAchievements({ ...base, sessions });
  assert.equal(list.find((a) => a.id === 'perfect-three')?.unlocked, true);
  assert.equal(list.find((a) => a.id === 'perfect-ten')?.unlocked, false);
});
