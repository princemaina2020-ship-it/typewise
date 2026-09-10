'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  Award,
  BarChart3,
  BookOpen,
  Brain,
  ChevronRight,
  Gauge,
  Hand,
  Home,
  Keyboard,
  Moon,
  Play,
  RotateCcw,
  Search,
  Settings,
  Sparkles,
  Star,
  Sun,
  Target,
  Trophy,
  User,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { BRAND, fingerForKey, keyRows, lessons, passages } from '@/lib/data';
import {
  evaluateAchievements,
  type AchievementProgress,
} from '@/lib/achievements';
import {
  calculateMetrics,
  calculateStreak,
  detectWeakKeys,
  KeyPerformance,
  levelFromXp,
  lessonPerformance,
  updateLessonRecord,
  type LessonRecordData,
  xpForSession,
} from '@/lib/typing/metrics';
type View =
  | 'home'
  | 'dashboard'
  | 'learn'
  | 'test'
  | 'practice'
  | 'statistics'
  | 'achievements'
  | 'leaderboard'
  | 'profile'
  | 'settings';
type Session = {
  id: string;
  date: string;
  mode: string;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  errors: number;
  duration: number;
  xp: number;
  samples: number[];
  keyStats: KeyPerformance;
};
type LessonRecord = LessonRecordData;
type Saved = {
  sessions: Session[];
  xp: number;
  completedLessons: number[];
  lessonStars: Record<number, number>;
  lessonScores: Record<number, number>;
  lessonRecords: Record<number, LessonRecord>;
  recordBreaks: number;
  unlockedAchievements: Record<string, string>;
  dailyGoal: number;
  theme: 'light' | 'dark';
};
const empty: Saved = {
  sessions: [],
  xp: 0,
  completedLessons: [],
  lessonStars: {},
  lessonScores: {},
  lessonRecords: {},
  recordBreaks: 0,
  unlockedAchievements: {},
  dailyGoal: 10,
  theme: 'light',
};
function useSaved() {
  const [data, setData] = useState(empty),
    [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const r = localStorage.getItem('typewise-progress');
      if (r) setData({ ...empty, ...JSON.parse(r) });
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) localStorage.setItem('typewise-progress', JSON.stringify(data));
  }, [data, ready]);
  return [data, setData] as const;
}
function achievementSnapshot(
  saved: Saved,
  session?: Session,
  lessonId?: number,
  newRecord = false,
) {
  const sessions = session ? [session, ...saved.sessions] : saved.sessions;
  const completed =
    lessonId && !saved.completedLessons.includes(lessonId)
      ? [...saved.completedLessons, lessonId]
      : saved.completedLessons;
  return {
    sessions,
    completedLessons: completed,
    streak: calculateStreak(sessions.map((s) => s.date.slice(0, 10))),
    recordBreaks: saved.recordBreaks + (newRecord ? 1 : 0),
    bestLessonScore: Math.max(
      0,
      ...Object.values(saved.lessonRecords).map((r) => r.bestScore),
      session?.mode.startsWith('Lesson')
        ? lessonPerformance(
            session.wpm,
            session.accuracy,
            calculateMetrics('', '', 1, session.samples).consistency,
          ).score
        : 0,
    ),
  };
}
const nav = [
  ['dashboard', 'Overview', Home],
  ['learn', 'Learn', BookOpen],
  ['practice', 'Smart practice', Brain],
  ['test', 'Typing test', Gauge],
  ['statistics', 'Statistics', BarChart3],
  ['achievements', 'Achievements', Award],
  ['leaderboard', 'Leaderboard', Trophy],
  ['profile', 'Profile', User],
  ['settings', 'Settings', Settings],
] as const;
export default function App() {
  const [view, setView] = useState<View>('home');
  const [saved, setSaved] = useSaved();
  useEffect(() => {
    document.documentElement.classList.toggle('dark', saved.theme === 'dark');
  }, [saved.theme]);
  const level = levelFromXp(saved.xp),
    record = Math.max(0, ...saved.sessions.map((s) => s.wpm));
  const go = (v: View) => {
    setView(v);
    scrollTo({ top: 0, behavior: 'smooth' });
  };
  const finish = (x: Session) =>
    setSaved((s) => {
      const badges = evaluateAchievements(achievementSnapshot(s, x)).filter(
        (a) => a.unlocked && !s.unlockedAchievements[a.id],
      );
      return {
        ...s,
        sessions: [x, ...s.sessions].slice(0, 250),
        xp: s.xp + x.xp + badges.reduce((sum, a) => sum + a.xp, 0),
        unlockedAchievements: {
          ...s.unlockedAchievements,
          ...Object.fromEntries(
            badges.map((a) => [a.id, new Date().toISOString()]),
          ),
        },
      };
    });
  if (view === 'home')
    return <Landing start={() => go('test')} explore={() => go('dashboard')} />;
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="brand" onClick={() => go('home')}>
          <Logo />
          <span>{BRAND.name}</span>
        </button>
        <nav>
          {nav.map(([id, label, Icon]) => (
            <button
              key={id}
              className={view === id ? 'active' : ''}
              onClick={() => go(id)}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-level">
          <span>
            Level {level.level} · {level.title}
          </span>
          <div className="progress">
            <i style={{ width: `${(level.current / level.needed) * 100}%` }} />
          </div>
          <small>
            {level.current} / {level.needed} XP
          </small>
        </div>
      </aside>
      <main className={`main page-surface page-${view}`}>
        <header className="topbar">
          <div className="mobile-brand">
            <Logo />
            <b>{BRAND.name}</b>
          </div>
          <button
            className="theme-button"
            aria-label="Toggle theme"
            onClick={() =>
              setSaved((s) => ({
                ...s,
                theme: s.theme === 'dark' ? 'light' : 'dark',
              }))
            }
          >
            {saved.theme === 'dark' ? <Sun /> : <Moon />}
          </button>
        </header>
        {view === 'dashboard' && <Dashboard saved={saved} go={go} />}{' '}
        {view === 'test' && <TypingSession onFinish={finish} best={record} />}{' '}
        {view === 'practice' && <Practice saved={saved} onFinish={finish} />}{' '}
        {view === 'learn' && (
          <Learn saved={saved} setSaved={setSaved} go={go} />
        )}{' '}
        {view === 'statistics' && <Statistics saved={saved} />}{' '}
        {view === 'achievements' && <Achievements saved={saved} />}{' '}
        {view === 'leaderboard' && <Leaderboard />}{' '}
        {view === 'profile' && <Profile saved={saved} />}{' '}
        {view === 'settings' && (
          <SettingsView saved={saved} setSaved={setSaved} />
        )}
      </main>
      <nav className="mobile-nav">
        {nav.slice(0, 5).map(([id, label, Icon]) => (
          <button
            key={id}
            className={view === id ? 'active' : ''}
            onClick={() => go(id)}
          >
            <Icon />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
function Logo() {
  return (
    <span className="logo">
      <i />
      <i />
      <i />
    </span>
  );
}
function Landing({
  start,
  explore,
}: {
  start: () => void;
  explore: () => void;
}) {
  const [typed, setTyped] = useState(''),
    demo = 'steady practice creates effortless speed';
  return (
    <div className="landing">
      <header className="landing-nav">
        <button className="brand">
          <Logo />
          <span>{BRAND.name}</span>
        </button>
        <div>
          <button className="link-button" onClick={explore}>
            Explore app
          </button>
          <button className="pill primary" onClick={start}>
            Start typing <ChevronRight size={16} />
          </button>
        </div>
      </header>
      <main>
        <section className="hero">
          <div className="eyebrow">
            <Sparkles size={14} /> A calmer way to get faster
          </div>
          <h1>
            Type with clarity.
            <br />
            <em>Move with confidence.</em>
          </h1>
          <p>
            Build lasting speed through thoughtful lessons, focused practice,
            and feedback that shows exactly where to improve.
          </p>
          <div className="hero-actions">
            <button className="pill primary" onClick={start}>
              Start typing <Play size={15} fill="currentColor" />
            </button>
            <button className="pill ghost" onClick={explore}>
              View your progress
            </button>
          </div>
        </section>
        <section className="demo-wrap">
          <div className="demo-head">
            <span>Quick warm-up</span>
            <span>
              {typed.length}/{demo.length}
            </span>
          </div>
          <button
            className="demo-type"
            onClick={() => document.getElementById('demo-input')?.focus()}
          >
            {demo.split('').map((c, i) => (
              <span
                key={i}
                className={
                  i < typed.length
                    ? typed[i] === c
                      ? 'correct'
                      : 'wrong'
                    : i === typed.length
                      ? 'current'
                      : ''
                }
              >
                {c}
              </span>
            ))}
          </button>
          <input
            id="demo-input"
            className="sr-input"
            value={typed}
            onChange={(e) => setTyped(e.target.value.slice(0, demo.length))}
          />
          <div className="demo-foot">
            <span>Click the text and begin</span>
            <button onClick={() => setTyped('')}>
              <RotateCcw size={14} /> reset
            </button>
          </div>
        </section>
        <section className="proof">
          <div>
            <strong>One clear path</strong>
            <p>
              Lessons introduce keys gradually, so good technique becomes second
              nature.
            </p>
          </div>
          <div>
            <strong>Practice that adapts</strong>
            <p>
              Every session reveals weak keys and shapes the next focused
              exercise.
            </p>
          </div>
          <div>
            <strong>Progress you can feel</strong>
            <p>
              Useful trends, steady goals, and quiet rewards keep momentum
              visible.
            </p>
          </div>
        </section>
        <section className="story">
          <div>
            <span className="kicker">THE TYPEWISE LOOP</span>
            <h2>Every session makes the next one smarter.</h2>
          </div>
          <ol>
            <li>
              <b>01</b>
              <span>Type naturally</span>
            </li>
            <li>
              <b>02</b>
              <span>See what slowed you down</span>
            </li>
            <li>
              <b>03</b>
              <span>Train the right keys</span>
            </li>
            <li>
              <b>04</b>
              <span>Return stronger tomorrow</span>
            </li>
          </ol>
        </section>
        <section className="cta">
          <h2>Your next personal best starts with one line.</h2>
          <button className="pill light" onClick={start}>
            Take a free test <ChevronRight size={16} />
          </button>
        </section>
      </main>
      <footer>
        <Logo />
        <span>
          {BRAND.name} · {BRAND.tagline}
        </span>
        <span>
          Private by default. Progress stays on your device in guest mode.
        </span>
      </footer>
    </div>
  );
}
function TypingSession({
  onFinish,
  best = 0,
  customText,
  modeName = '30 second test',
  lessonMode = false,
  lessonTitle,
  lessonRecord,
  targetWpm,
  targetAccuracy,
  onNext,
  onPractice,
  completionBadges,
}: {
  onFinish: (s: Session) => void;
  best?: number;
  customText?: string;
  modeName?: string;
  lessonMode?: boolean;
  lessonTitle?: string;
  lessonRecord?: LessonRecord;
  targetWpm?: number;
  targetAccuracy?: number;
  onNext?: () => void;
  onPractice?: () => void;
  completionBadges?: (session: Session) => AchievementProgress[];
}) {
  const [duration, setDuration] = useState(30),
    [text, setText] = useState(customText || passages[0]),
    [typed, setTyped] = useState(''),
    [started, setStarted] = useState<number | null>(null),
    [now, setNow] = useState(() => Date.now()),
    [result, setResult] = useState<Session | null>(null),
    [samples, setSamples] = useState<number[]>([]),
    [armed, setArmed] = useState(!lessonMode),
    [showKeyboard, setShowKeyboard] = useState(true),
    [showFingers, setShowFingers] = useState(true),
    [sound, setSound] = useState(false),
    [badges, setBadges] = useState<AchievementProgress[]>([]),
    [baselineRecord, setBaselineRecord] = useState<LessonRecord | undefined>(
      lessonRecord,
    );
  const keys = useRef<KeyPerformance>({}),
    last = useRef<number>(0),
    input = useRef<HTMLInputElement>(null),
    audioContext = useRef<AudioContext | null>(null);
  const elapsed = started
      ? lessonMode
        ? now - started
        : Math.min(duration * 1000, now - started)
      : 0,
    metrics = calculateMetrics(text, typed, elapsed, samples),
    remaining = Math.max(0, duration - Math.floor(elapsed / 1000));
  const complete = useCallback(() => {
    if (!started || result) return;
    const final = calculateMetrics(
        text,
        typed,
        Math.max(
          1000,
          lessonMode
            ? Date.now() - started
            : Math.min(duration * 1000, Date.now() - started),
        ),
        samples,
      ),
      session = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        mode: modeName,
        wpm: final.wpm,
        rawWpm: final.rawWpm,
        accuracy: final.accuracy,
        errors: final.errors,
        duration: Math.max(
          1,
          Math.round(
            (lessonMode
              ? Date.now() - started
              : Math.min(duration * 1000, Date.now() - started)) / 1000,
          ),
        ),
        xp: xpForSession(
          final.wpm,
          final.accuracy,
          lessonMode ? Math.round((Date.now() - started) / 1000) : duration,
        ),
        samples,
        keyStats: keys.current,
      };
    setBadges(completionBadges?.(session) || []);
    setResult(session);
    onFinish(session);
  }, [
    started,
    result,
    text,
    typed,
    duration,
    samples,
    onFinish,
    modeName,
    lessonMode,
    completionBadges,
  ]);
  useEffect(() => {
    if (!started || result) return;
    const t = setInterval(() => {
      setNow(Date.now());
      if (!lessonMode && Date.now() - started >= duration * 1000) complete();
    }, 100);
    return () => clearInterval(t);
  }, [started, result, duration, complete, lessonMode]);
  useEffect(() => {
    if (started && !result && typed.length >= text.length) complete();
  }, [typed, text, started, result, complete]);
  const reset = () => {
    setTyped('');
    setStarted(null);
    setResult(null);
    setSamples([]);
    setArmed(!lessonMode);
    setBadges([]);
    setBaselineRecord(lessonRecord);
    keys.current = {};
    setText(
      customText || passages[Math.floor(Math.random() * passages.length)],
    );
    setTimeout(() => input.current?.focus(), 0);
  };
  if (result)
    return (
      <Result
        session={result}
        best={best}
        retry={reset}
        lessonMode={lessonMode}
        lessonTitle={lessonTitle}
        lessonRecord={baselineRecord}
        targetWpm={targetWpm}
        targetAccuracy={targetAccuracy}
        badges={badges}
        onNext={onNext}
        onPractice={onPractice}
      />
    );
  if (lessonMode && !armed)
    return (
      <section className="lesson-start">
        <span className="kicker">READY WHEN YOU ARE</span>
        <h2>{lessonTitle}</h2>
        <p>
          Settle your hands on the home row. The exercise begins on your first
          key after you press start.
        </p>
        <div className="start-preview">{text}</div>
        <button
          className="start-lesson-button"
          onClick={() => {
            setArmed(true);
            setTimeout(() => input.current?.focus(), 180);
          }}
        >
          <Play size={17} fill="currentColor" /> Start lesson
        </button>
        <small>No timer. Begin when you feel ready.</small>
      </section>
    );
  return (
    <section className="typing-page">
      <div className="page-intro">
        <div>
          <span className="kicker">FOCUS MODE</span>
          <h1>Typing test</h1>
        </div>
        <div className="mode-tabs">
          {[15, 30, 60, 120].map((n) => (
            <button
              key={n}
              className={duration === n ? 'selected' : ''}
              onClick={() => {
                setDuration(n);
                reset();
              }}
            >
              {n}s
            </button>
          ))}
        </div>
      </div>
      {!lessonMode && (
        <div className="live-stats">
          <div>
            <b>{remaining}</b>
            <span>seconds</span>
          </div>
          <div>
            <b>{metrics.wpm}</b>
            <span>wpm</span>
          </div>
          <div>
            <b>{metrics.accuracy}%</b>
            <span>accuracy</span>
          </div>
        </div>
      )}
      {lessonMode && (
        <div className="lesson-toolbar">
          <div className="lesson-live">
            <span>
              <b>{metrics.wpm}</b> WPM
            </span>
            <span>
              <b>{metrics.accuracy}%</b> accuracy
            </span>
            <span>
              <b>{Math.round((typed.length / text.length) * 100)}%</b> progress
            </span>
          </div>
          <div className="lesson-tools">
            <button className="lesson-restart" onClick={reset}>
              <RotateCcw size={16} /> Restart lesson
            </button>
            <button
              className={showKeyboard ? 'is-on' : ''}
              onClick={() => setShowKeyboard((v) => !v)}
              title="Toggle keyboard"
              aria-label="Toggle visual keyboard"
            >
              <Keyboard size={16} />
            </button>
            <button
              className={showFingers ? 'is-on' : ''}
              onClick={() => setShowFingers((v) => !v)}
              title="Toggle finger guide"
              aria-label="Toggle finger guide"
            >
              <Hand size={16} />
            </button>
            <button
              className={sound ? 'is-on' : ''}
              onClick={() => setSound((v) => !v)}
              title="Toggle typing sound"
              aria-label="Toggle typing sound"
            >
              {sound ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
          </div>
        </div>
      )}
      <button className="typing-area" onClick={() => input.current?.focus()}>
        {text.split('').map((c, i) => (
          <span
            key={i}
            className={
              i < typed.length
                ? typed[i] === c
                  ? 'correct'
                  : 'wrong'
                : i === typed.length
                  ? 'current'
                  : ''
            }
          >
            {c}
          </span>
        ))}
      </button>
      <input
        ref={input}
        className="sr-input"
        value={typed}
        onPaste={(event) => {
          if (lessonMode) event.preventDefault();
        }}
        onChange={(e) => {
          const val = e.target.value.slice(0, text.length);
          if (!started) {
            setStarted(Date.now());
            last.current = Date.now();
          }
          const i = val.length - 1;
          if (i >= 0 && val.length > typed.length) {
            const key =
                text[i].toUpperCase() === ' ' ? 'SPACE' : text[i].toUpperCase(),
              delta = Date.now() - last.current,
              p = keys.current[key] || {
                presses: 0,
                correct: 0,
                totalResponseMs: 0,
              };
            keys.current[key] = {
              presses: p.presses + 1,
              correct: p.correct + (val[i] === text[i] ? 1 : 0),
              totalResponseMs: p.totalResponseMs + delta,
            };
            if (sound) {
              try {
                const context = audioContext.current || new AudioContext();
                audioContext.current = context;
                const oscillator = context.createOscillator(),
                  gain = context.createGain();
                oscillator.frequency.value = val[i] === text[i] ? 520 : 170;
                gain.gain.setValueAtTime(0.025, context.currentTime);
                gain.gain.exponentialRampToValueAtTime(
                  0.001,
                  context.currentTime + 0.035,
                );
                oscillator.connect(gain);
                gain.connect(context.destination);
                oscillator.start();
                oscillator.stop(context.currentTime + 0.04);
              } catch {}
            }
            last.current = Date.now();
            if (i % 5 === 0 && started)
              setSamples((s) => [
                ...s,
                calculateMetrics(text, val, Date.now() - started).wpm,
              ]);
          }
          setTyped(val);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') reset();
        }}
        spellCheck={false}
      />
      {showKeyboard && <VirtualKeyboard next={text[typed.length] || ''} />}
      {lessonMode && showFingers && (
        <FingerGuide next={text[typed.length] || ''} />
      )}
      {!lessonMode && (
        <div className="type-hint">
          <span>Click above, then type. Backspace is welcome.</span>
          <button onClick={reset}>
            <RotateCcw size={14} /> restart
          </button>
        </div>
      )}
    </section>
  );
}
function VirtualKeyboard({ next }: { next: string }) {
  const n = next === ' ' ? 'SPACE' : next.toUpperCase();
  const rows = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'BACKSPACE'],
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', 'ENTER'],
    ['SHIFT', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/', 'SHIFT'],
    ['SPACE'],
  ];
  return (
    <div className="keyboard" aria-label="Visual QWERTY keyboard">
      {rows.map((row, i) => (
        <div className="key-row" key={i}>
          {row.map((k, index) => (
            <kbd
              key={`${k}-${index}`}
              className={`${k === n ? 'next' : ''} ${['SHIFT', 'ENTER', 'BACKSPACE'].includes(k) ? 'key-wide' : ''}`}
              title={fingerForKey[k]}
            >
              {k === 'SPACE'
                ? ''
                : k === 'BACKSPACE'
                  ? 'delete'
                  : k.toLowerCase()}
              <small>{k === n ? fingerForKey[k] : ''}</small>
            </kbd>
          ))}
        </div>
      ))}
    </div>
  );
}
function FingerGuide({ next }: { next: string }) {
  const normalized = next === ' ' ? 'SPACE' : next.toUpperCase(),
    active = fingerForKey[normalized] || '';
  const fingers = [
    'L pinky',
    'L ring',
    'L middle',
    'L index',
    'Thumbs',
    'R index',
    'R middle',
    'R ring',
    'R pinky',
  ];
  return (
    <div
      className="finger-guide"
      aria-label={`Use ${active || 'the indicated finger'}`}
    >
      <span className="finger-caption">
        Finger guide <b>{active || 'Get ready'}</b>
      </span>
      <div className="finger-map">
        {fingers.map((finger, i) => (
          <div
            key={finger}
            className={`${active === finger ? 'active' : ''} finger-${i}`}
          >
            <i />
            <small>{finger.replace('L ', '').replace('R ', '')}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
function Result({
  session,
  best,
  retry,
  lessonMode = false,
  lessonTitle,
  lessonRecord,
  targetWpm = 0,
  targetAccuracy = 0,
  badges = [],
  onNext,
  onPractice,
}: {
  session: Session;
  best: number;
  retry: () => void;
  lessonMode?: boolean;
  lessonTitle?: string;
  lessonRecord?: LessonRecord;
  targetWpm?: number;
  targetAccuracy?: number;
  badges?: AchievementProgress[];
  onNext?: () => void;
  onPractice?: () => void;
}) {
  const weak = detectWeakKeys(session.keyStats);
  const consistency = calculateMetrics('', '', 1, session.samples).consistency;
  const { stars, score } = lessonPerformance(
    session.wpm,
    session.accuracy,
    consistency,
  );
  const isHighScore = lessonMode && score > (lessonRecord?.bestScore || 0),
    previousBest = lessonRecord?.bestScore || 0;
  const characterCount = Object.values(session.keyStats).reduce(
      (a, k) => a + k.presses,
      0,
    ),
    correctCharacters = Object.values(session.keyStats).reduce(
      (a, k) => a + k.correct,
      0,
    );
  if (lessonMode) {
    const duration = `${Math.floor(session.duration / 60)}:${String(
        session.duration % 60,
      ).padStart(2, '0')}`,
      speedScale = Math.max(targetWpm * 2, 40),
      accuracyAngle = `${Math.min(session.accuracy, 100) * 3.6}deg`,
      speedAngle = `${Math.min(session.wpm / speedScale, 1) * 360}deg`;
    return (
      <section className="result-page lesson-result-screen">
        <span className="result-complete-label">Lesson complete</span>
        <div
          className="result-star-arc"
          aria-label={`${stars} out of 6 stars earned`}
        >
          {[1, 2, 3, 4, 5, 6].map((star) => (
            <Star
              key={star}
              className={star <= stars ? 'earned' : ''}
              fill={star <= stars ? 'currentColor' : 'none'}
              style={{ animationDelay: `${star * 130}ms` }}
            />
          ))}
        </div>
        <div className="result-dial-row">
          <div className="dial-column">
            <div
              className="result-dial accuracy-dial"
              style={{ '--gauge-angle': accuracyAngle } as React.CSSProperties}
              aria-label={`${session.accuracy}% accuracy`}
            >
              <div>
                <b>{session.accuracy}%</b>
                <small>real accuracy</small>
              </div>
            </div>
            <span className="dial-requirement">{targetAccuracy}% minimum</span>
            <strong>accuracy</strong>
          </div>
          <div className="result-center-column">
            <div className="duration-dial">
              <div>
                <b>{duration}</b>
                <small>min : seconds</small>
              </div>
            </div>
            <strong>duration</strong>
            <div className="lesson-score-number">{score.toLocaleString()}</div>
            <span className={isHighScore ? 'new-score' : ''}>
              {isHighScore
                ? 'NEW HIGH SCORE'
                : `BEST ${Math.max(score, previousBest).toLocaleString()}`}
            </span>
          </div>
          <div className="dial-column">
            <div
              className="result-dial speed-dial"
              style={{ '--gauge-angle': speedAngle } as React.CSSProperties}
              aria-label={`${session.wpm} words per minute`}
            >
              <div>
                <b>{session.wpm}</b>
                <small>wpm</small>
              </div>
            </div>
            <span className="dial-requirement">Goal {targetWpm} wpm</span>
            <strong>speed</strong>
          </div>
        </div>
        <div className="lesson-result-summary">
          <span>
            <Zap size={15} /> <b>+{session.xp} XP</b>
          </span>
          <span>
            <Activity size={15} />
            {weak.length
              ? `Focus next: ${weak.map((key) => key.key).join(', ')}`
              : `${consistency}% consistency · no problem keys`}
          </span>
          {badges.length > 0 && (
            <span className="result-badge-pill">
              <Award size={15} />
              <b>{badges[0].name}</b>
              {badges.length > 1 && ` +${badges.length - 1}`}
            </span>
          )}
        </div>
        <div className="result-actions lesson-result-actions">
          {onNext && (
            <button className="pill primary" onClick={onNext}>
              Next lesson <ChevronRight size={15} />
            </button>
          )}
          <button className="pill secondary" onClick={retry}>
            <RotateCcw size={15} /> Retake lesson
          </button>
          {onPractice && (
            <button className="pill ghost" onClick={onPractice}>
              Practice weak keys
            </button>
          )}
        </div>
      </section>
    );
  }
  return (
    <section className="result-page">
      <span className="eyebrow">
        <Sparkles size={14} />{' '}
        {lessonMode ? 'Lesson complete' : 'Session complete'}
      </span>
      {lessonMode && (
        <div
          className="lesson-stars"
          aria-label={`${stars} out of 6 stars earned with a score of ${score}`}
        >
          <div className="score-seal">
            <b>{score}</b>
            <span>score</span>
          </div>
          <div className="star-row">
            {[1, 2, 3, 4, 5, 6].map((star) => (
              <Star
                key={star}
                className={star <= stars ? 'earned' : ''}
                fill={star <= stars ? 'currentColor' : 'none'}
                style={{ animationDelay: `${star * 180}ms` }}
              />
            ))}
          </div>
          <strong>
            {stars === 6
              ? 'Exceptional control'
              : stars >= 4
                ? 'Strong performance'
                : stars >= 2
                  ? 'Good progress'
                  : 'Lesson complete'}{' '}
            · {stars}/6 stars
          </strong>
        </div>
      )}
      <h1>
        {lessonMode
          ? lessonTitle
          : session.wpm > best && best > 0
            ? 'A new personal best.'
            : 'That was a solid step.'}
      </h1>
      <div className="result-hero">
        <div>
          <b>{session.wpm}</b>
          <span>WPM</span>
        </div>
        <div>
          <b>{session.accuracy}%</b>
          <span>accuracy</span>
        </div>
      </div>
      {lessonMode && (
        <div className={`high-score-panel ${isHighScore ? 'new-record' : ''}`}>
          <div>
            <span>{isHighScore ? 'NEW HIGH SCORE' : 'LESSON SCORE'}</span>
            <b>{score.toLocaleString()}</b>
          </div>
          <dl>
            <div>
              <dt>Previous best</dt>
              <dd>
                {previousBest ? previousBest.toLocaleString() : 'First attempt'}
              </dd>
            </div>
            <div>
              <dt>Difference</dt>
              <dd className={score >= previousBest ? 'positive' : ''}>
                {previousBest
                  ? `${score - previousBest >= 0 ? '+' : ''}${(score - previousBest).toLocaleString()}`
                  : '—'}
              </dd>
            </div>
            <div>
              <dt>Attempts</dt>
              <dd>{(lessonRecord?.attempts || 0) + 1}</dd>
            </div>
          </dl>
        </div>
      )}
      <div className="metric-grid">
        <Stat
          label={lessonMode ? 'Average speed' : 'Raw speed'}
          value={`${lessonMode ? session.wpm : session.rawWpm} wpm`}
        />
        <Stat label="Consistency" value={`${consistency}%`} />
        <Stat label="Errors" value={session.errors} />
        <Stat label="Duration" value={`${session.duration}s`} />
        <Stat label="XP earned" value={`+${session.xp}`} />
        {lessonMode && (
          <>
            <Stat label="Correct characters" value={correctCharacters} />
            <Stat label="Characters" value={characterCount} />
          </>
        )}
      </div>
      {lessonMode && lessonRecord && (
        <div className="comparison">
          <div className="comparison-head">
            <span>Performance comparison</span>
            <span>This run</span>
            <span>Personal best</span>
          </div>
          <div>
            <b>WPM</b>
            <span>{session.wpm}</span>
            <span>{Math.max(session.wpm, lessonRecord.bestWpm)}</span>
          </div>
          <div>
            <b>Accuracy</b>
            <span>{session.accuracy}%</span>
            <span>
              {Math.max(session.accuracy, lessonRecord.bestAccuracy)}%
            </span>
          </div>
          <div>
            <b>Score</b>
            <span>{score.toLocaleString()}</span>
            <span>
              {Math.max(score, lessonRecord.bestScore).toLocaleString()}
            </span>
          </div>
          <div>
            <b>Time</b>
            <span>{session.duration}s</span>
            <span>{lessonRecord.bestDuration}s</span>
          </div>
        </div>
      )}
      <div className="analysis">
        <div>
          <span className="kicker">
            {lessonMode ? 'LESSON ANALYSIS' : 'YOUR NEXT MOVE'}
          </span>
          <h2>
            {weak.length
              ? `Give ${weak.map((w) => w.key).join(', ')} a little attention.`
              : 'Your accuracy looks beautifully balanced.'}
          </h2>
          <p>
            {weak.length
              ? 'These keys were slower or less accurate than the rest. A focused drill will help reinforce them.'
              : 'Keep the same relaxed rhythm and gradually extend the session.'}
          </p>
        </div>
        <div className="weak-list">
          {weak.map((w) => (
            <span key={w.key}>
              <kbd>{w.key}</kbd>
              <i>{w.accuracy}% accuracy</i>
            </span>
          ))}
        </div>
      </div>
      {lessonMode && badges.length > 0 && (
        <div className="result-achievements">
          <span className="kicker">
            ACHIEVEMENT{badges.length > 1 ? 'S' : ''} UNLOCKED
          </span>
          {badges.map((badge, i) => (
            <div key={badge.id} style={{ animationDelay: `${i * 140}ms` }}>
              <Award />
              <span>
                <b>{badge.name}</b>
                <small>{badge.description}</small>
              </span>
              <strong>+{badge.xp} XP</strong>
            </div>
          ))}
        </div>
      )}
      <div className="result-actions">
        {lessonMode && onNext && (
          <button className="pill primary" onClick={onNext}>
            Next lesson <ChevronRight size={15} />
          </button>
        )}
        <button
          className={lessonMode ? 'pill secondary' : 'pill primary'}
          onClick={retry}
        >
          <RotateCcw size={15} />{' '}
          {session.mode.startsWith('Lesson') ? 'Retake lesson' : 'Try again'}
        </button>
        {lessonMode && onPractice && (
          <button className="pill ghost" onClick={onPractice}>
            Practice weak keys
          </button>
        )}
        {!lessonMode && (
          <button
            className="pill ghost"
            onClick={() =>
              navigator.clipboard?.writeText(
                `I typed ${session.wpm} WPM at ${session.accuracy}% accuracy on Typewise.`,
              )
            }
          >
            Share result
          </button>
        )}
      </div>
    </section>
  );
}
function Dashboard({ saved, go }: { saved: Saved; go: (v: View) => void }) {
  const ss = saved.sessions,
    avg = Math.round(
      ss.reduce((a, s) => a + s.wpm, 0) / Math.max(1, ss.length),
    ),
    acc = Math.round(
      ss.reduce((a, s) => a + s.accuracy, 0) / Math.max(1, ss.length),
    ),
    level = levelFromXp(saved.xp),
    streak = calculateStreak(ss.map((s) => s.date.slice(0, 10))),
    minutes = Math.round(
      ss
        .filter(
          (s) => s.date.slice(0, 10) === new Date().toISOString().slice(0, 10),
        )
        .reduce((a, s) => a + s.duration, 0) / 60,
    ),
    weak = weakFromSessions(ss);
  return (
    <section className="dashboard">
      <div className="page-intro">
        <div>
          <span className="kicker">WELCOME BACK</span>
          <h1>
            Good{' '}
            {new Date().getHours() < 12
              ? 'morning'
              : new Date().getHours() < 18
                ? 'afternoon'
                : 'evening'}
            .
          </h1>
          <p>
            {ss.length
              ? 'Your rhythm is taking shape. Keep it light and steady.'
              : 'Your first session is waiting. Start gently and let accuracy lead.'}
          </p>
        </div>
        <button className="pill primary" onClick={() => go('test')}>
          <Play size={15} fill="currentColor" /> Quick test
        </button>
      </div>
      <div className="dashboard-grid">
        <div className="goal-panel">
          <span className="kicker">TODAY’S GOAL</span>
          <div
            className="goal-ring"
            style={
              {
                '--progress': `${Math.min(100, (minutes / saved.dailyGoal) * 100)}%`,
              } as React.CSSProperties
            }
          >
            <div>
              <b>{minutes}</b>
              <span>of {saved.dailyGoal} min</span>
            </div>
          </div>
          <h2>
            {minutes >= saved.dailyGoal
              ? 'Goal complete. Nicely done.'
              : 'A few focused minutes go far.'}
          </h2>
          <button onClick={() => go('practice')}>
            Continue practicing <ChevronRight size={15} />
          </button>
        </div>
        <div className="overview-panel">
          <div className="four-stats">
            <Stat
              label="Average speed"
              value={`${avg} wpm`}
              delta={ss.length ? 'recent sessions' : 'start a test'}
            />
            <Stat
              label="Accuracy"
              value={`${ss.length ? acc : 100}%`}
              delta="aim for 95%+"
            />
            <Stat
              label="Current streak"
              value={`${streak} days`}
              delta={streak ? 'keep it alive' : 'begin today'}
            />
            <Stat label="Level" value={level.level} delta={level.title} />
          </div>
          <MiniChart sessions={ss} />
        </div>
      </div>
      <div className="split">
        <div className="section-block">
          <div className="section-title">
            <div>
              <span className="kicker">CONTINUE LEARNING</span>
              <h2>
                {lessons[saved.completedLessons.length]?.title ||
                  'Course complete'}
              </h2>
            </div>
            <span>{saved.completedLessons.length}/100 lessons</span>
          </div>
          <div className="progress">
            <i style={{ width: `${saved.completedLessons.length}%` }} />
          </div>
          <button className="row-action" onClick={() => go('learn')}>
            <span>
              <BookOpen />{' '}
              {lessons[saved.completedLessons.length]?.section ||
                'Review lessons'}
            </span>
            <ChevronRight />
          </button>
        </div>
        <div className="section-block">
          <span className="kicker">SMART PRACTICE</span>
          <h2>
            {weak.length
              ? `${weak.map((w) => w.key).join(', ')} could use attention.`
              : 'Build a baseline first.'}
          </h2>
          <p>
            {weak.length
              ? 'A short adaptive drill will place these keys in natural words.'
              : 'Complete a typing session and we’ll find your first focus keys.'}
          </p>
          <button
            className="text-link"
            onClick={() => go(weak.length ? 'practice' : 'test')}
          >
            {weak.length ? 'Start a focused drill' : 'Take your first test'}{' '}
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
      <Recent sessions={ss} />
    </section>
  );
}
function weakFromSessions(ss: Session[]) {
  const all: KeyPerformance = {};
  ss.forEach((s) =>
    Object.entries(s.keyStats).forEach(([k, v]) => {
      const p = all[k] || { presses: 0, correct: 0, totalResponseMs: 0 };
      all[k] = {
        presses: p.presses + v.presses,
        correct: p.correct + v.correct,
        totalResponseMs: p.totalResponseMs + v.totalResponseMs,
      };
    }),
  );
  return detectWeakKeys(all);
}
function MiniChart({ sessions }: { sessions: Session[] }) {
  const p = [...sessions].reverse().slice(-10);
  if (!p.length)
    return (
      <div className="empty-chart">
        <Activity />
        <span>Your speed trend will appear after your first test.</span>
      </div>
    );
  const max = Math.max(...p.map((s) => s.wpm), 20);
  return (
    <div className="mini-chart">
      <div className="chart-label">
        <span>Speed trend</span>
        <b>{p.at(-1)?.wpm} WPM</b>
      </div>
      <svg viewBox="0 0 500 150" preserveAspectRatio="none">
        <polyline
          points={p
            .map(
              (x, i) =>
                `${(i / Math.max(1, p.length - 1)) * 500},${140 - (x.wpm / max) * 120}`,
            )
            .join(' ')}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}
function Stat({
  label,
  value,
  delta,
}: {
  label: string;
  value: string | number;
  delta?: string;
}) {
  return (
    <div className="stat">
      <span>{label}</span>
      <b>{value}</b>
      {delta && <small>{delta}</small>}
    </div>
  );
}
function Recent({ sessions }: { sessions: Session[] }) {
  return (
    <div className="recent">
      <div className="section-title">
        <div>
          <span className="kicker">RECENT SESSIONS</span>
          <h2>Your practice history</h2>
        </div>
      </div>
      {!sessions.length ? (
        <div className="empty">
          <Keyboard />
          <h3>No typing sessions yet.</h3>
          <p>Your results will gather here after a test.</p>
        </div>
      ) : (
        <div className="session-table">
          {sessions.slice(0, 6).map((s) => (
            <div key={s.id}>
              <span>
                {new Date(s.date).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
                <small>{s.mode}</small>
              </span>
              <b>
                {s.wpm} <small>wpm</small>
              </b>
              <b>{s.accuracy}%</b>
              <i>+{s.xp} XP</i>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
function Practice({
  saved,
  onFinish,
}: {
  saved: Saved;
  onFinish: (s: Session) => void;
}) {
  const keys = weakFromSessions(saved.sessions)
      .map((w) => w.key.toLowerCase())
      .filter((k) => k.length === 1),
    bank = [
      'practice',
      'bright',
      'progress',
      'rhythm',
      'patient',
      'purpose',
      'balance',
      'breathe',
      'precise',
      'repeat',
      'better',
      'brave',
      'proper',
      'prepare',
      'present',
    ];
  const matches = bank.filter((w) => keys.some((k) => w.includes(k))),
    drill = keys.length
      ? Array.from(
          { length: 28 },
          (_, i) =>
            (matches.length ? matches : bank)[
              i % (matches.length || bank.length)
            ],
        ).join(' ')
      : 'gentle rhythm steady hands patient progress clear focus calm practice';
  return (
    <TypingSession
      customText={drill}
      modeName="smart practice"
      onFinish={onFinish}
    />
  );
}
function Learn({
  saved,
  setSaved,
  go,
}: {
  saved: Saved;
  setSaved: React.Dispatch<React.SetStateAction<Saved>>;
  go: (view: View) => void;
}) {
  const initialLesson = Math.min(
    saved.completedLessons.length + 1,
    lessons.length,
  );
  const [q, setQ] = useState(''),
    [active, setActive] = useState<number | null>(null),
    [selectedSection, setSelectedSection] = useState(
      lessons[initialLesson - 1]?.section || lessons[0].section,
    );
  const newBadgesFor = (lessonId: number, session: Session) => {
    const consistency = calculateMetrics(
        '',
        '',
        1,
        session.samples,
      ).consistency,
      score = lessonPerformance(
        session.wpm,
        session.accuracy,
        consistency,
      ).score,
      isRecord = score > (saved.lessonRecords[lessonId]?.bestScore || 0);
    return evaluateAchievements(
      achievementSnapshot(saved, session, lessonId, isRecord),
    ).filter((a) => a.unlocked && !saved.unlockedAchievements[a.id]);
  };
  const saveLesson = (lessonId: number, reward: number, session: Session) =>
    setSaved((s) => {
      const consistency = calculateMetrics(
          '',
          '',
          1,
          session.samples,
        ).consistency,
        performance = lessonPerformance(
          session.wpm,
          session.accuracy,
          consistency,
        ),
        previous = s.lessonRecords[lessonId],
        recordUpdate = updateLessonRecord(previous, {
          score: performance.score,
          wpm: session.wpm,
          accuracy: session.accuracy,
          consistency,
          duration: session.duration,
        }),
        isRecord = recordUpdate.isRecord,
        badges = evaluateAchievements(
          achievementSnapshot(s, session, lessonId, isRecord),
        ).filter((a) => a.unlocked && !s.unlockedAchievements[a.id]);
      return {
        ...s,
        sessions: [session, ...s.sessions].slice(0, 250),
        xp:
          s.xp +
          session.xp +
          (s.completedLessons.includes(lessonId) ? 0 : reward) +
          badges.reduce((sum, a) => sum + a.xp, 0),
        completedLessons: s.completedLessons.includes(lessonId)
          ? s.completedLessons
          : [...s.completedLessons, lessonId],
        lessonStars: {
          ...s.lessonStars,
          [lessonId]: Math.max(s.lessonStars[lessonId] || 0, performance.stars),
        },
        lessonScores: {
          ...s.lessonScores,
          [lessonId]: Math.max(
            s.lessonScores[lessonId] || 0,
            performance.score,
          ),
        },
        lessonRecords: { ...s.lessonRecords, [lessonId]: recordUpdate.record },
        recordBreaks: s.recordBreaks + (isRecord ? 1 : 0),
        unlockedAchievements: {
          ...s.unlockedAchievements,
          ...Object.fromEntries(
            badges.map((a) => [a.id, new Date().toISOString()]),
          ),
        },
      };
    });
  if (active) {
    const l = lessons[active - 1];
    return (
      <section className="lesson-focus">
        <header className="lesson-focus-header">
          <button
            className="lesson-back"
            onClick={() => setActive(null)}
            title="Back to course"
          >
            <ArrowLeft size={18} /> <span>Course</span>
          </button>
          <div className="lesson-breadcrumb">
            <span>{l.section}</span>
            <b>
              Lesson {l.id} · {l.title}
            </b>
          </div>
          <div className="lesson-header-progress">
            <span>
              Lesson {l.id} of {lessons.length}
            </span>
            <div className="progress">
              <i style={{ width: `${l.id}%` }} />
            </div>
          </div>
          <div className="lesson-focus-actions">
            <button
              className="theme-button"
              aria-label="Toggle dark mode"
              onClick={() =>
                setSaved((s) => ({
                  ...s,
                  theme: s.theme === 'dark' ? 'light' : 'dark',
                }))
              }
            >
              {saved.theme === 'dark' ? <Sun /> : <Moon />}
            </button>
            <button
              className="icon-control"
              onClick={() => go('dashboard')}
              title="Dashboard"
              aria-label="Go to dashboard"
            >
              <Home size={16} />
            </button>
          </div>
        </header>
        <div className="lesson-focus-body">
          <TypingSession
            key={l.id}
            customText={l.exercise}
            modeName={`Lesson ${l.id}`}
            lessonMode
            lessonTitle={l.title}
            lessonRecord={saved.lessonRecords[l.id]}
            targetWpm={l.wpm}
            targetAccuracy={l.accuracy}
            completionBadges={(session) => newBadgesFor(l.id, session)}
            onNext={() => setActive(Math.min(lessons.length, l.id + 1))}
            onPractice={() => go('practice')}
            best={0}
            onFinish={(session) => saveLesson(l.id, l.xp, session)}
          />
        </div>
      </section>
    );
  }
  const sectionNames = [...new Set(lessons.map((l) => l.section))],
    currentLesson = initialLesson,
    query = q.trim().toLowerCase(),
    list = lessons
      .filter((l) =>
        query
          ? (l.title + l.section + l.keys).toLowerCase().includes(query)
          : l.section === selectedSection,
      )
      .slice(0, 15);
  return (
    <section>
      <div className="page-intro learn-intro">
        <div>
          <span className="kicker">STRUCTURED COURSE</span>
          <h1>Learn one movement at a time.</h1>
        </div>
        <label className="search">
          <Search />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search lessons"
          />
        </label>
      </div>
      <div className="learn-hub">
        <aside className="course-rail">
          <span className="rail-title">Touch Typing Fundamentals</span>
          <div className="rail-progress">
            <b>{saved.completedLessons.length}</b>
            <span>/ {lessons.length} lessons</span>
          </div>
          <div className="progress">
            <i style={{ width: `${saved.completedLessons.length}%` }} />
          </div>
          <nav>
            {sectionNames.map((section) => {
              const complete = lessons
                .filter((l) => l.section === section)
                .every((l) => saved.completedLessons.includes(l.id));
              return (
                <button
                  key={section}
                  className={selectedSection === section ? 'current' : ''}
                  onClick={() => {
                    setSelectedSection(section);
                    setQ('');
                  }}
                >
                  <i>
                    {complete
                      ? '✓'
                      : String(sectionNames.indexOf(section) + 1).padStart(
                          2,
                          '0',
                        )}
                  </i>
                  <span>{section}</span>
                </button>
              );
            })}
          </nav>
        </aside>
        <div className="lesson-column">
          <div className="path-heading">
            <span className="kicker">
              {query ? 'SEARCH RESULTS' : 'LESSON SET'}
            </span>
            <h2>{query ? `“${q.trim()}”` : selectedSection}</h2>
            <p>{list.length} lessons · select any available exercise.</p>
          </div>
          <div className="course-list">
            {list.map((l) => {
              const done = saved.completedLessons.includes(l.id),
                unlocked = l.id <= saved.completedLessons.length + 1;
              return (
                <button
                  key={l.id}
                  id={`lesson-${l.id}`}
                  disabled={!unlocked}
                  onClick={() => setActive(l.id)}
                >
                  <span className={`lesson-num ${done ? 'done' : ''}`}>
                    {done ? '✓' : l.id}
                  </span>
                  <span>
                    <small>Lesson {l.id}</small>
                    <b>{l.title}</b>
                    <i>{l.keys}</i>
                  </span>
                  {saved.lessonStars[l.id] > 0 && (
                    <strong className="course-stars">
                      {'★'.repeat(saved.lessonStars[l.id])}
                      {'☆'.repeat(6 - saved.lessonStars[l.id])}
                      <small>{saved.lessonScores[l.id]} pts</small>
                    </strong>
                  )}
                  <em
                    className={`lesson-status ${done ? 'complete' : l.id === currentLesson ? 'current' : 'available'}`}
                  >
                    {done
                      ? 'Completed'
                      : l.id === currentLesson
                        ? 'Continue'
                        : unlocked
                          ? 'Start'
                          : 'Locked'}
                  </em>
                  <ChevronRight />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
function Statistics({ saved }: { saved: Saved }) {
  const ss = saved.sessions,
    avg = (k: 'wpm' | 'accuracy') =>
      ss.length ? Math.round(ss.reduce((a, s) => a + s[k], 0) / ss.length) : 0,
    total = ss.reduce((a, s) => a + s.duration, 0);
  return (
    <section>
      <div className="page-intro">
        <div>
          <span className="kicker">STATISTICS</span>
          <h1>The shape of your progress.</h1>
          <p>Useful signals, without the noise.</p>
        </div>
      </div>
      <div className="metric-grid stats-big">
        <Stat label="Average WPM" value={avg('wpm')} />
        <Stat label="Best WPM" value={Math.max(0, ...ss.map((s) => s.wpm))} />
        <Stat label="Average accuracy" value={`${avg('accuracy')}%`} />
        <Stat label="Practice time" value={`${Math.round(total / 60)} min`} />
        <Stat
          label="Characters"
          value={ss
            .reduce(
              (a, s) => a + Math.round((s.rawWpm * 5 * s.duration) / 60),
              0,
            )
            .toLocaleString()}
        />
        <Stat label="Tests completed" value={ss.length} />
      </div>
      <div className="chart-card">
        <span className="kicker">WPM OVER TIME</span>
        <MiniChart sessions={ss} />
      </div>
      <KeyHeatmap sessions={ss} />
      <Recent sessions={ss} />
    </section>
  );
}
function KeyHeatmap({ sessions }: { sessions: Session[] }) {
  const all: KeyPerformance = {};
  sessions.forEach((s) =>
    Object.entries(s.keyStats).forEach(([k, v]) => {
      const p = all[k] || { presses: 0, correct: 0, totalResponseMs: 0 };
      all[k] = {
        presses: p.presses + v.presses,
        correct: p.correct + v.correct,
        totalResponseMs: p.totalResponseMs + v.totalResponseMs,
      };
    }),
  );
  return (
    <div className="chart-card">
      <span className="kicker">KEY MASTERY</span>
      <h2>Your keyboard heatmap</h2>
      <div className="heatmap">
        {keyRows.flat().map((k) => {
          const v = all[k],
            a = v ? Math.round((v.correct / v.presses) * 100) : null;
          return (
            <div key={k}>
              <kbd>{k === 'SPACE' ? 'space' : k}</kbd>
              <small>{a === null ? '—' : `${a}%`}</small>
            </div>
          );
        })}
      </div>
    </div>
  );
}
function Achievements({ saved }: { saved: Saved }) {
  const [filter, setFilter] = useState('All');
  const items = evaluateAchievements(achievementSnapshot(saved)),
    earned = items.filter((a) => a.unlocked).length,
    shown = items.filter((a) => filter === 'All' || a.category === filter);
  return (
    <section>
      <div className="page-intro">
        <div>
          <span className="kicker">ACHIEVEMENTS</span>
          <h1>Quiet proof of consistent work.</h1>
          <p>
            {earned
              ? `You’ve earned ${earned} of ${items.length} meaningful milestones.`
              : 'Your first achievement is one session away.'}
          </p>
        </div>
      </div>
      <div className="achievement-filters">
        {[
          'All',
          'Speed',
          'Accuracy',
          'Lessons',
          'Practice',
          'Streak',
          'Records',
        ].map((category) => (
          <button
            key={category}
            className={filter === category ? 'active' : ''}
            onClick={() => setFilter(category)}
          >
            {category}
          </button>
        ))}
      </div>
      <div className="achievement-grid">
        {shown.map((a) => (
          <article
            key={a.id}
            className={
              a.unlocked ? `earned rarity-${a.rarity.toLowerCase()}` : ''
            }
          >
            <div className="award-icon">
              <Award />
            </div>
            <span>{a.rarity}</span>
            <h3>{a.name}</h3>
            <p>{a.description}</p>
            <div className="progress">
              <i style={{ width: `${a.progress}%` }} />
            </div>
            <small>
              {a.progress}% · +{a.xp} XP{' '}
              {saved.unlockedAchievements[a.id] &&
                `· ${new Date(saved.unlockedAchievements[a.id]).toLocaleDateString()}`}
            </small>
          </article>
        ))}
      </div>
    </section>
  );
}
function Leaderboard() {
  const rows = [
    ['mira_k', '124', '99.1%'],
    ['quietkeys', '117', '98.4%'],
    ['devon.types', '109', '99.6%'],
    ['northstar', '103', '97.9%'],
    ['steadyhands', '98', '100%'],
  ];
  return (
    <section>
      <div className="page-intro">
        <div>
          <span className="kicker">LEADERBOARD · 60 SECONDS</span>
          <h1>Fast, fair, and focused.</h1>
          <p>
            Verified sessions only. Unusual results are reviewed before ranking.
          </p>
        </div>
      </div>
      <div className="leaderboard">
        {rows.map((r, i) => (
          <div key={r[0]}>
            <b>{String(i + 1).padStart(2, '0')}</b>
            <span>
              <i className="avatar">{r[0][0].toUpperCase()}</i>
              {r[0]}
            </span>
            <strong>
              {r[1]} <small>WPM</small>
            </strong>
            <em>{r[2]}</em>
          </div>
        ))}
      </div>
    </section>
  );
}
function Profile({ saved }: { saved: Saved }) {
  const l = levelFromXp(saved.xp);
  return (
    <section>
      <div className="profile-head">
        <div className="profile-avatar">G</div>
        <div>
          <span className="kicker">GUEST PROFILE</span>
          <h1>Guest typist</h1>
          <p>Your progress is saved privately on this device.</p>
        </div>
      </div>
      <div className="metric-grid stats-big">
        <Stat label="Current level" value={l.level} delta={l.title} />
        <Stat label="Total XP" value={saved.xp} />
        <Stat
          label="Best WPM"
          value={Math.max(0, ...saved.sessions.map((s) => s.wpm))}
        />
        <Stat
          label="Achievements"
          value={
            evaluateAchievements(achievementSnapshot(saved)).filter(
              (a) => a.unlocked,
            ).length
          }
        />
      </div>
      <div className="section-block">
        <h2>Ready to sync across devices?</h2>
        <p>
          Hosted identity is prepared. Guest mode remains fully usable without
          registration.
        </p>
        <button className="pill primary">Sign in with ChatGPT</button>
      </div>
    </section>
  );
}
function SettingsView({
  saved,
  setSaved,
}: {
  saved: Saved;
  setSaved: React.Dispatch<React.SetStateAction<Saved>>;
}) {
  return (
    <section>
      <div className="page-intro">
        <div>
          <span className="kicker">SETTINGS</span>
          <h1>Make the space yours.</h1>
        </div>
      </div>
      <div className="settings-list">
        <div>
          <span>
            <Moon />
            <b>Appearance</b>
            <small>Choose a comfortable theme.</small>
          </span>
          <button
            className="pill ghost"
            onClick={() =>
              setSaved((s) => ({
                ...s,
                theme: s.theme === 'dark' ? 'light' : 'dark',
              }))
            }
          >
            {saved.theme === 'dark' ? 'Dark' : 'Light'}
          </button>
        </div>
        <div>
          <span>
            <Target />
            <b>Daily practice goal</b>
            <small>A gentle target that fits your routine.</small>
          </span>
          <select
            value={saved.dailyGoal}
            onChange={(e) =>
              setSaved((s) => ({ ...s, dailyGoal: +e.target.value }))
            }
          >
            <option value="5">5 minutes</option>
            <option value="10">10 minutes</option>
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
          </select>
        </div>
        <div>
          <span>
            <Keyboard />
            <b>Guest data</b>
            <small>Stored only in this browser.</small>
          </span>
          <button
            className="pill ghost"
            onClick={() => {
              if (confirm('Clear all guest progress?'))
                setSaved({ ...empty, theme: saved.theme });
            }}
          >
            Clear progress
          </button>
        </div>
      </div>
    </section>
  );
}
