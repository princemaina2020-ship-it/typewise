export const BRAND = { name: 'Typewise', tagline: 'Find your flow.' };
export const passages = [
  'Small steps repeated with care become remarkable skill. Keep your eyes on the words and let your hands learn the path.',
  'A steady rhythm matters more than sudden speed. Relax your shoulders, breathe normally, and press each key with purpose.',
  'Clear thinking grows from patient practice. Accuracy builds confidence, and confidence gradually turns into natural speed.',
  'The quiet keyboard rewards consistency. Each careful line strengthens the connection between thought and motion.',
];
const sections = [
  ['Foundations', 'Posture & finger map', 'fj fj jf jf'],
  ['Home Row', 'F and J anchors', 'fff jjj fjf jfj'],
  ['Home Row', 'A S D F', 'asdf sad fad dads'],
  ['Home Row', 'J K L ;', 'jkl; all fall ask'],
  ['Top Row', 'E and I', 'erie idle ride'],
  ['Top Row', 'R T Y U', 'true try your route'],
  ['Top Row', 'Q W O P', 'power quote row'],
  ['Bottom Row', 'C and M', 'calm comic mimic'],
  ['Bottom Row', 'V B N', 'brave van never'],
  ['Bottom Row', 'Z X , . /', 'zoom, examine.'],
  ['Technique', 'Capital letters', 'Calm Hands Move Well'],
  ['Technique', 'Numbers', '2026 15 30 60 120'],
  ['Technique', 'Punctuation', 'Ready, set; type!'],
  ['Fluency', 'Common words', 'the of and to in is you'],
  ['Fluency', 'Short sentences', 'Good habits make typing easy.'],
  ['Speed', 'Gentle bursts', 'fast focus flow'],
  ['Accuracy', 'Precision drill', 'precision before pace'],
  ['Professional', 'Email rhythm', 'Thank you for your thoughtful note.'],
  [
    'Code',
    'JavaScript basics',
    'const total = values.reduce((a, b) => a + b, 0);',
  ],
  ['Code', 'Python basics', 'result = [value * 2 for value in numbers]'],
] as const;
export const lessons = Array.from({ length: 100 }, (_, i) => {
  const s = sections[i % sections.length],
    tier = Math.floor(i / sections.length);
  return {
    id: i + 1,
    section: s[0],
    title: s[1],
    exercise: `${s[2]} ${s[2]}${tier ? ' steady practice builds skill' : ''}`,
    keys: [...new Set(s[2].toUpperCase().replace(/[^A-Z0-9;,./]/g, ''))].join(
      ' ',
    ),
    accuracy: Math.min(96, 88 + tier),
    wpm: 12 + tier * 4 + (i % 5),
    xp: 50 + tier * 15,
  };
});
const names = [
  'First Flight',
  'Warm Up',
  'In the Flow',
  'Ten Tests',
  'Focused Hour',
  'Daily Ritual',
  'Three Day Rhythm',
  'Seven Days Strong',
  'Month of Discipline',
  'Clean Slate',
  'Perfectionist',
  'Steady Hands',
  'Twenty WPM',
  'Speedster',
  'Quick Fingers',
  'Rapid Fire',
  'Century Club',
  'Lightning',
  'One Thousand Words',
  'Marathon Typist',
  'Keyboard Warrior',
  'Home Row Hero',
  'Top Row Trekker',
  'Bottom Row Boss',
  'Symbol Scholar',
  'Number Navigator',
  'Capital Idea',
  'Code Cadet',
  'JavaScript Jockey',
  'Python Pilot',
  'Accuracy Ace',
  'Consistency Crown',
  'Comeback',
  'Personal Best',
  'Early Bird',
  'Night Owl',
  'Lunch Break Learner',
  'Five Lessons',
  'Course Climber',
  'Lesson Legend',
  'Weak Key Tamer',
  'Balanced Hands',
  'Left Hand Lift',
  'Right Hand Rise',
  'Punctuation Pro',
  'Endurance Engine',
  'Burst Master',
  'Daily Goal',
  'Weekly Winner',
  'Keyboard Legend',
];
export const achievements = names.map((name, i) => ({
  id: i + 1,
  name,
  description:
    i === 0
      ? 'Complete your first typing session.'
      : `Reach milestone ${i + 1} on your typing journey.`,
  rarity:
    i > 44
      ? 'Legendary'
      : i > 34
        ? 'Epic'
        : i > 22
          ? 'Rare'
          : i > 10
            ? 'Uncommon'
            : 'Common',
  target: i === 0 ? 1 : (i + 1) * 5,
  xp: 25 + i * 5,
}));
export const keyRows = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/'],
  ['SPACE'],
];
export const fingerForKey: Record<string, string> = {
  Q: 'L pinky',
  A: 'L pinky',
  Z: 'L pinky',
  W: 'L ring',
  S: 'L ring',
  X: 'L ring',
  E: 'L middle',
  D: 'L middle',
  C: 'L middle',
  R: 'L index',
  F: 'L index',
  V: 'L index',
  T: 'L index',
  G: 'L index',
  B: 'L index',
  Y: 'R index',
  H: 'R index',
  N: 'R index',
  U: 'R index',
  J: 'R index',
  M: 'R index',
  I: 'R middle',
  K: 'R middle',
  ',': 'R middle',
  O: 'R ring',
  L: 'R ring',
  '.': 'R ring',
  P: 'R pinky',
  ';': 'R pinky',
  '/': 'R pinky',
  SPACE: 'Thumbs',
};
