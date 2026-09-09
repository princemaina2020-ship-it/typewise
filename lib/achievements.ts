export type AchievementRarity =
  | 'Common'
  | 'Uncommon'
  | 'Rare'
  | 'Epic'
  | 'Legendary';
export type AchievementDefinition = {
  id: string;
  name: string;
  description: string;
  category:
    | 'Speed'
    | 'Accuracy'
    | 'Lessons'
    | 'Practice'
    | 'Streak'
    | 'Records';
  rarity: AchievementRarity;
  xp: number;
  target: number;
  metric:
    | 'wpm'
    | 'accuracy'
    | 'lessons'
    | 'seconds'
    | 'words'
    | 'streak'
    | 'records'
    | 'score';
};
export type AchievementSession = {
  wpm: number;
  accuracy: number;
  duration: number;
  rawWpm: number;
  errors: number;
  mode: string;
};
export type AchievementSnapshot = {
  sessions: AchievementSession[];
  completedLessons: number[];
  streak: number;
  recordBreaks: number;
  bestLessonScore: number;
};
const rarity = (i: number, total: number): AchievementRarity =>
  i === total - 1
    ? 'Legendary'
    : i >= total * 0.7
      ? 'Epic'
      : i >= total * 0.4
        ? 'Rare'
        : i >= total * 0.18
          ? 'Uncommon'
          : 'Common';
const speed = [20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 150];
const speedNames = [
  'Getting Started',
  'Finding Rhythm',
  'Quick Hands',
  'Half Century',
  'Speed Typist',
  'Fast Fingers',
  'Rapid Typist',
  'Keyboard Racer',
  'Century Club',
  'Velocity',
  'Lightning',
  'Elite Speed',
  'Typing Machine',
];
const accuracy = [95, 97, 98, 99, 100],
  accuracyNames = [
    'Clean Run',
    'Sharp Focus',
    'Precision',
    'Near Perfect',
    'Flawless',
  ];
const lessonCounts = [1, 5, 10, 25, 50, 100],
  lessonNames = [
    'First Lesson',
    'Five Down',
    'Building Momentum',
    'Course Climber',
    'Halfway There',
    'Course Complete',
  ];
const practice = [600, 3600, 18000, 36000, 90000, 180000, 360000],
  practiceNames = [
    'Ten Focused Minutes',
    'The First Hour',
    'Five Hour Flow',
    'Committed Practice',
    'Deep Work',
    'Fifty Hours',
    'Century of Practice',
  ];
const words = [1000, 5000, 10000, 50000, 100000, 250000, 1000000],
  wordNames = [
    'First Thousand',
    'Five Thousand Strong',
    'Marathon Typist',
    'Wordsmith',
    'Keyboard Warrior',
    'Quarter Million',
    'Million Key Mind',
  ];
const streaks = [3, 7, 14, 30, 60, 100, 365],
  streakNames = [
    'Three Day Rhythm',
    'Seven Days Strong',
    'Two Week Flow',
    'Month of Discipline',
    'Sixty Steady Days',
    'Hundred Day Habit',
    'Year in Motion',
  ];
const records = [1, 5, 25],
  recordNames = [
    'First Personal Best',
    'Record Chaser',
    'Personal Best Collector',
  ];
const scores = [5000, 7500, 10000],
  scoreNames = ['Five Grand', 'High Performer', 'Perfect Ten'];
const make = (
  values: number[],
  names: string[],
  category: AchievementDefinition['category'],
  metric: AchievementDefinition['metric'],
  baseXp: number,
) =>
  values.map(
    (target, i): AchievementDefinition => ({
      id: `${metric}-${target}`,
      name: names[i],
      description:
        metric === 'wpm'
          ? `Reach ${target} WPM in a meaningful 30+ second session.`
          : metric === 'accuracy'
            ? `Complete a meaningful session with ${target}% accuracy.`
            : metric === 'seconds'
              ? `Practice for ${Math.round(target / 360) / 10} total hours.`
              : metric === 'words'
                ? `Type ${target.toLocaleString()} words.`
                : metric === 'lessons'
                  ? `Complete ${target} lesson${target === 1 ? '' : 's'}.`
                  : metric === 'streak'
                    ? `Maintain a ${target}-day practice streak.`
                    : metric === 'records'
                      ? `Set ${target} personal best${target === 1 ? '' : 's'}.`
                      : `Earn a lesson score of ${target.toLocaleString()}.`,
      category,
      metric,
      target,
      rarity: rarity(i, values.length),
      xp: baseXp + i * 50,
    }),
  );
export const achievementDefinitions: AchievementDefinition[] = [
  ...make(speed, speedNames, 'Speed', 'wpm', 75),
  ...make(accuracy, accuracyNames, 'Accuracy', 'accuracy', 100),
  ...make(lessonCounts, lessonNames, 'Lessons', 'lessons', 75),
  ...make(practice, practiceNames, 'Practice', 'seconds', 100),
  ...make(words, wordNames, 'Practice', 'words', 100),
  ...make(streaks, streakNames, 'Streak', 'streak', 125),
  ...make(records, recordNames, 'Records', 'records', 150),
  ...make(scores, scoreNames, 'Records', 'score', 175),
  {
    id: 'home-row',
    name: 'Home Row Graduate',
    description: 'Complete the first four home-row lessons.',
    category: 'Lessons',
    metric: 'lessons',
    target: 4,
    rarity: 'Uncommon',
    xp: 150,
  },
  {
    id: 'error-free-60',
    name: 'Unbroken Focus',
    description: 'Complete a 60+ second session without an error.',
    category: 'Accuracy',
    metric: 'accuracy',
    target: 100,
    rarity: 'Rare',
    xp: 250,
  },
  {
    id: 'perfect-three',
    name: 'Triple Perfect',
    description: 'Finish three lessons at 100% accuracy.',
    category: 'Accuracy',
    metric: 'lessons',
    target: 3,
    rarity: 'Rare',
    xp: 225,
  },
  {
    id: 'perfect-ten',
    name: 'Precision Practice',
    description: 'Finish ten lessons at 100% accuracy.',
    category: 'Accuracy',
    metric: 'lessons',
    target: 10,
    rarity: 'Epic',
    xp: 500,
  },
];
export type AchievementProgress = AchievementDefinition & {
  value: number;
  progress: number;
  unlocked: boolean;
};
export function evaluateAchievements(
  snapshot: AchievementSnapshot,
): AchievementProgress[] {
  const meaningful = snapshot.sessions.filter((s) => s.duration >= 30),
    bestWpm = Math.max(0, ...meaningful.map((s) => s.wpm)),
    bestAccuracy = Math.max(
      0,
      ...snapshot.sessions
        .filter((s) => s.duration >= 15)
        .map((s) => s.accuracy),
    );
  const seconds = snapshot.sessions.reduce((a, s) => a + s.duration, 0),
    words = Math.round(
      snapshot.sessions.reduce((a, s) => a + (s.rawWpm * s.duration) / 60, 0),
    );
  const valueFor = (a: AchievementDefinition) =>
    a.id === 'home-row'
      ? Math.min(snapshot.completedLessons.filter((n) => n <= 4).length, 4)
      : a.id === 'error-free-60'
        ? snapshot.sessions.some((s) => s.duration >= 60 && s.errors === 0)
          ? 100
          : 0
        : a.id === 'perfect-three' || a.id === 'perfect-ten'
          ? snapshot.sessions.filter(
              (s) => s.mode.startsWith('Lesson') && s.accuracy === 100,
            ).length
          : a.metric === 'wpm'
            ? bestWpm
            : a.metric === 'accuracy'
              ? bestAccuracy
              : a.metric === 'lessons'
                ? snapshot.completedLessons.length
                : a.metric === 'seconds'
                  ? seconds
                  : a.metric === 'words'
                    ? words
                    : a.metric === 'streak'
                      ? snapshot.streak
                      : a.metric === 'records'
                        ? snapshot.recordBreaks
                        : snapshot.bestLessonScore;
  return achievementDefinitions.map((a) => {
    const value = valueFor(a);
    return {
      ...a,
      value,
      progress: Math.min(100, Math.round((value / a.target) * 100)),
      unlocked: value >= a.target,
    };
  });
}
