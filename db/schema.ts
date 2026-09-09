import {
  integer,
  index,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';
const stamps = {
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
};
export const users = sqliteTable(
  'users',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull(),
    role: text('role').notNull().default('USER'),
    subscriptionPlan: text('subscription_plan').notNull().default('FREE'),
    xp: integer('xp').notNull().default(0),
    ...stamps,
  },
  (t) => [uniqueIndex('idx_users_email').on(t.email)],
);
export const profiles = sqliteTable('profiles', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  username: text('username').notNull(),
  avatarUrl: text('avatar_url'),
  publicProfile: integer('public_profile', { mode: 'boolean' })
    .notNull()
    .default(false),
  ...stamps,
});
export const typingSessions = sqliteTable(
  'typing_sessions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id),
    mode: text('mode').notNull(),
    wpm: integer('wpm').notNull(),
    rawWpm: integer('raw_wpm').notNull(),
    accuracy: real('accuracy').notNull(),
    duration: integer('duration').notNull(),
    errors: integer('errors').notNull(),
    typedText: text('typed_text'),
    suspicious: integer('suspicious', { mode: 'boolean' })
      .notNull()
      .default(false),
    ...stamps,
  },
  (t) => [uniqueIndex('idx_sessions_id_user').on(t.id, t.userId)],
);
export const keyStatistics = sqliteTable(
  'key_statistics',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    key: text('key').notNull(),
    presses: integer('presses').notNull().default(0),
    correct: integer('correct').notNull().default(0),
    responseMs: integer('response_ms').notNull().default(0),
    ...stamps,
  },
  (t) => [uniqueIndex('idx_key_stats_user_key').on(t.userId, t.key)],
);
export const lessonProgress = sqliteTable(
  'lesson_progress',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    lessonId: integer('lesson_id').notNull(),
    bestWpm: integer('best_wpm'),
    bestAccuracy: real('best_accuracy'),
    completedAt: text('completed_at'),
    ...stamps,
  },
  (t) => [
    uniqueIndex('idx_lesson_progress_user_lesson').on(t.userId, t.lessonId),
  ],
);
export const lessonAttempts = sqliteTable(
  'lesson_attempts',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    lessonId: integer('lesson_id').notNull(),
    wpm: integer('wpm').notNull(),
    rawWpm: integer('raw_wpm').notNull(),
    accuracy: real('accuracy').notNull(),
    consistency: real('consistency').notNull(),
    score: integer('score').notNull(),
    duration: integer('duration').notNull(),
    errors: integer('errors').notNull(),
    characters: integer('characters').notNull(),
    createdAt: text('created_at').notNull(),
  },
  (t) => [
    index('idx_lesson_attempts_user_lesson_date').on(
      t.userId,
      t.lessonId,
      t.createdAt,
    ),
  ],
);
export const lessonBests = sqliteTable(
  'lesson_bests',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    lessonId: integer('lesson_id').notNull(),
    bestScore: integer('best_score').notNull(),
    bestWpm: integer('best_wpm').notNull(),
    bestAccuracy: real('best_accuracy').notNull(),
    bestConsistency: real('best_consistency').notNull(),
    bestDuration: integer('best_duration').notNull(),
    attemptId: text('attempt_id')
      .notNull()
      .references(() => lessonAttempts.id),
    updatedAt: text('updated_at').notNull(),
  },
  (t) => [uniqueIndex('idx_lesson_bests_user_lesson').on(t.userId, t.lessonId)],
);
export const achievements = sqliteTable('achievements', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(),
  rarity: text('rarity').notNull(),
  xpReward: integer('xp_reward').notNull(),
  metric: text('metric').notNull(),
  target: integer('target').notNull(),
  ...stamps,
});
export const userAchievements = sqliteTable(
  'user_achievements',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    achievementId: text('achievement_id')
      .notNull()
      .references(() => achievements.id),
    progress: integer('progress').notNull().default(0),
    unlockedAt: text('unlocked_at'),
    ...stamps,
  },
  (t) => [
    uniqueIndex('idx_achievement_user_item').on(t.userId, t.achievementId),
  ],
);
export const goals = sqliteTable(
  'daily_goals',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    kind: text('kind').notNull(),
    target: integer('target').notNull(),
    date: text('date').notNull(),
    progress: integer('progress').notNull().default(0),
    ...stamps,
  },
  (t) => [uniqueIndex('idx_goals_user_date').on(t.userId, t.date)],
);
export const xpTransactions = sqliteTable('xp_transactions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  amount: integer('amount').notNull(),
  source: text('source').notNull(),
  sourceId: text('source_id'),
  createdAt: text('created_at').notNull(),
});
