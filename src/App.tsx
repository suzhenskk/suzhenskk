import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

type Level = 'Beginner' | 'Intermediate' | 'Advanced'
type Tab = 'dashboard' | 'lessons' | 'practice'

interface UserProfile {
  name: string
  level: Level
  dailyGoal: number
  focus: 'Travel' | 'Business' | 'Study' | 'Everyday conversations'
}

interface Lesson {
  id: string
  title: string
  skill: 'Vocabulary' | 'Grammar' | 'Conversation' | 'Listening'
  difficulty: Level
  duration: number
  description: string
  question: string
  options: string[]
  correctAnswerIndex: number
}

interface VocabularyCard {
  id: string
  english: string
  hint: string
  example: string
}

const PROFILE_KEY = 'english-app-profile'
const COMPLETED_KEY = 'english-app-completed-lessons'
const KNOWN_WORDS_KEY = 'english-app-known-words'
const QUIZ_HISTORY_KEY = 'english-app-quiz-history'
const SKIP_COUNT_KEY = 'english-app-setup-skip-count'
const TUTORIAL_DISMISSED_KEY = 'english-app-tutorial-dismissed'

const defaultProfile: UserProfile = {
  name: 'Learner',
  level: 'Beginner',
  dailyGoal: 15,
  focus: 'Everyday conversations',
}

const lessons: Lesson[] = [
  {
    id: 'l1',
    title: 'Daily Greetings',
    skill: 'Conversation',
    difficulty: 'Beginner',
    duration: 10,
    description: 'Practice natural greetings for morning, afternoon, and evening.',
    question: 'Which sentence sounds the most natural when meeting someone at 8 AM?',
    options: ['Good night!', 'Good morning!', 'Have a nice evening!', 'See you tomorrow morning!'],
    correctAnswerIndex: 1,
  },
  {
    id: 'l2',
    title: 'Travel Essentials',
    skill: 'Vocabulary',
    difficulty: 'Beginner',
    duration: 15,
    description: 'Learn practical words for airports, hotels, and transportation.',
    question: 'What does "boarding pass" mean?',
    options: ['A map of the airport', 'A ticket used to enter the airplane', 'A suitcase tag', 'A travel insurance plan'],
    correctAnswerIndex: 1,
  },
  {
    id: 'l3',
    title: 'Present Perfect Basics',
    skill: 'Grammar',
    difficulty: 'Intermediate',
    duration: 20,
    description: 'Use present perfect to connect past actions with present results.',
    question: 'Choose the correct sentence:',
    options: ['I have went to London.', 'I have gone to London.', 'I has gone to London.', 'I gone to London.'],
    correctAnswerIndex: 1,
  },
  {
    id: 'l4',
    title: 'Workplace Meetings',
    skill: 'Listening',
    difficulty: 'Intermediate',
    duration: 18,
    description: 'Understand common phrases used in standups and project meetings.',
    question: 'What is the best meaning of "Let’s circle back tomorrow"?',
    options: ['Cancel the meeting forever', 'Repeat the same meeting now', 'Revisit this topic tomorrow', 'Start from the beginning'],
    correctAnswerIndex: 2,
  },
  {
    id: 'l5',
    title: 'Negotiation Language',
    skill: 'Conversation',
    difficulty: 'Advanced',
    duration: 22,
    description: 'Build confidence with polite yet clear negotiation phrasing.',
    question: 'Which phrase is the most diplomatic way to disagree?',
    options: [
      'That idea is wrong.',
      'I completely reject this.',
      'I see your point, but I suggest a different approach.',
      'No, that makes no sense.',
    ],
    correctAnswerIndex: 2,
  },
]

const vocabularyCards: VocabularyCard[] = [
  { id: 'v1', english: 'Schedule', hint: 'A plan for time', example: 'Could we review the schedule for next week?' },
  { id: 'v2', english: 'Reservation', hint: 'Booking in advance', example: 'I made a reservation for two nights.' },
  { id: 'v3', english: 'Improve', hint: 'Make better', example: 'I want to improve my speaking confidence.' },
  { id: 'v4', english: 'Deadline', hint: 'Final time limit', example: 'The project deadline is Friday afternoon.' },
  { id: 'v5', english: 'Reliable', hint: 'Can be trusted', example: 'She is a reliable teammate.' },
]

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeStorage<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value))
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function App() {
  const [profile, setProfile] = useState<UserProfile | null>(() => readStorage<UserProfile | null>(PROFILE_KEY, null))
  const [draftProfile, setDraftProfile] = useState<UserProfile>(() => readStorage<UserProfile>(PROFILE_KEY, defaultProfile))
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [completedLessons, setCompletedLessons] = useState<string[]>(() => readStorage<string[]>(COMPLETED_KEY, []))
  const [knownWords, setKnownWords] = useState<string[]>(() => readStorage<string[]>(KNOWN_WORDS_KEY, []))
  const [quizHistory, setQuizHistory] = useState<{ attempted: number; correct: number }>(() =>
    readStorage<{ attempted: number; correct: number }>(QUIZ_HISTORY_KEY, { attempted: 0, correct: 0 }),
  )
  const [skipCount, setSkipCount] = useState<number>(() => readStorage<number>(SKIP_COUNT_KEY, 0))
  const [tutorialDismissed, setTutorialDismissed] = useState<boolean>(() =>
    readStorage<boolean>(TUTORIAL_DISMISSED_KEY, false),
  )
  const [showSetup, setShowSetup] = useState<boolean>(() => readStorage<UserProfile | null>(PROFILE_KEY, null) === null)
  const [tutorialSnoozed, setTutorialSnoozed] = useState(false)
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null)
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null)
  const [quizResult, setQuizResult] = useState<'correct' | 'incorrect' | null>(null)
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [highlightedLessonId, setHighlightedLessonId] = useState<string | null>(null)

  useEffect(() => {
    writeStorage(PROFILE_KEY, profile)
  }, [profile])

  useEffect(() => {
    writeStorage(COMPLETED_KEY, completedLessons)
  }, [completedLessons])

  useEffect(() => {
    writeStorage(KNOWN_WORDS_KEY, knownWords)
  }, [knownWords])

  useEffect(() => {
    writeStorage(QUIZ_HISTORY_KEY, quizHistory)
  }, [quizHistory])

  useEffect(() => {
    writeStorage(SKIP_COUNT_KEY, skipCount)
  }, [skipCount])

  useEffect(() => {
    writeStorage(TUTORIAL_DISMISSED_KEY, tutorialDismissed)
  }, [tutorialDismissed])

  const activeLesson = useMemo(
    () => lessons.find((lesson) => lesson.id === activeLessonId) ?? null,
    [activeLessonId],
  )

  const completedCount = completedLessons.length
  const studiedMinutes = lessons
    .filter((lesson) => completedLessons.includes(lesson.id))
    .reduce((total, lesson) => total + lesson.duration, 0)
  const dailyGoal = profile?.dailyGoal ?? defaultProfile.dailyGoal
  const progressPercent = clamp(Math.round((studiedMinutes / dailyGoal) * 100), 0, 100)
  const knownWordsPercent = clamp(Math.round((knownWords.length / vocabularyCards.length) * 100), 0, 100)
  const xp = completedCount * 25 + quizHistory.correct * 10 + knownWords.length * 5

  const recommendedLesson =
    lessons.find(
      (lesson) => !completedLessons.includes(lesson.id) && (profile ? lesson.difficulty === profile.level : true),
    ) ??
    lessons.find((lesson) => !completedLessons.includes(lesson.id)) ??
    lessons[0]

  const currentWord = vocabularyCards[currentWordIndex]

  const quizAccuracy = quizHistory.attempted === 0 ? 0 : Math.round((quizHistory.correct / quizHistory.attempted) * 100)
  const showTutorial = skipCount >= 2 && !tutorialDismissed && !tutorialSnoozed

  function openSetupModal() {
    setDraftProfile(profile ?? defaultProfile)
    setShowSetup(true)
  }

  function openLessonQuiz(lessonId: string) {
    setActiveLessonId(lessonId)
    setSelectedAnswerIndex(null)
    setQuizResult(null)
  }

  function handleAnswerSelection(answerIndex: number) {
    if (!activeLesson) {
      return
    }

    setSelectedAnswerIndex(answerIndex)
    const isCorrect = answerIndex === activeLesson.correctAnswerIndex
    setQuizResult(isCorrect ? 'correct' : 'incorrect')
    setQuizHistory((previous) => ({
      attempted: previous.attempted + 1,
      correct: previous.correct + (isCorrect ? 1 : 0),
    }))

    if (isCorrect) {
      setCompletedLessons((previous) => {
        if (previous.includes(activeLesson.id)) {
          return previous
        }
        return [...previous, activeLesson.id]
      })
    }
  }

  function handleSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalizedProfile: UserProfile = {
      ...draftProfile,
      name: draftProfile.name.trim() || 'Learner',
      dailyGoal: clamp(draftProfile.dailyGoal, 5, 90),
    }

    setProfile(normalizedProfile)
    setShowSetup(false)
  }

  function handleSkipSetup() {
    setSkipCount((current) => current + 1)
    setTutorialSnoozed(false)
    if (!profile) {
      setProfile(defaultProfile)
    }
    setShowSetup(false)
  }

  function markWordAsKnown(wordId: string) {
    setKnownWords((previous) => (previous.includes(wordId) ? previous : [...previous, wordId]))
  }

  function resetProgress() {
    setCompletedLessons([])
    setKnownWords([])
    setQuizHistory({ attempted: 0, correct: 0 })
    setActiveLessonId(null)
    setSelectedAnswerIndex(null)
    setQuizResult(null)
    setCurrentWordIndex(0)
    setHighlightedLessonId(null)
  }

  function closeTutorial(permanently: boolean) {
    if (permanently) {
      setTutorialDismissed(true)
      setTutorialSnoozed(false)
      return
    }
    setTutorialSnoozed(true)
  }

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div>
          <p className="eyebrow">English Learning App</p>
          <h1>Speak with confidence every day</h1>
          <p className="subtitle">
            {profile
              ? `Welcome back, ${profile.name}. Focus: ${profile.focus}.`
              : 'Set up your profile to receive personalized recommendations.'}
          </p>
        </div>
        <div className="top-bar-actions">
          <button className="ghost-button" onClick={openSetupModal}>
            {profile ? 'Edit profile' : 'Start setup'}
          </button>
          <button className="ghost-button" onClick={resetProgress}>
            Reset progress
          </button>
        </div>
      </header>

      <nav className="tabs" aria-label="Main app sections">
        <button className={activeTab === 'dashboard' ? 'tab active' : 'tab'} onClick={() => setActiveTab('dashboard')}>
          Dashboard
        </button>
        <button className={activeTab === 'lessons' ? 'tab active' : 'tab'} onClick={() => setActiveTab('lessons')}>
          Lessons
        </button>
        <button className={activeTab === 'practice' ? 'tab active' : 'tab'} onClick={() => setActiveTab('practice')}>
          Practice
        </button>
      </nav>

      <section className="stats-grid">
        <article className="stat-card">
          <p className="stat-label">Learning XP</p>
          <p className="stat-value">{xp}</p>
        </article>
        <article className="stat-card">
          <p className="stat-label">Lessons completed</p>
          <p className="stat-value">{completedCount}</p>
        </article>
        <article className="stat-card">
          <p className="stat-label">Quiz accuracy</p>
          <p className="stat-value">{quizAccuracy}%</p>
        </article>
        <article className="stat-card">
          <p className="stat-label">Known words</p>
          <p className="stat-value">{knownWords.length}</p>
        </article>
      </section>

      {activeTab === 'dashboard' && (
        <section className="content-card">
          <h2>Daily progress</h2>
          <p className="section-hint">
            You have studied <strong>{studiedMinutes}</strong> minutes today. Target: <strong>{dailyGoal}</strong>{' '}
            minutes.
          </p>
          <div className="progress-row">
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
            </div>
            <span className="progress-value">{progressPercent}%</span>
          </div>

          <div className="dashboard-grid">
            <article className="nested-card">
              <h3>Recommended next lesson</h3>
              <p className="nested-title">{recommendedLesson.title}</p>
              <p>{recommendedLesson.description}</p>
              <button
                className="primary-button"
                onClick={() => {
                  setActiveTab('lessons')
                  openLessonQuiz(recommendedLesson.id)
                  setHighlightedLessonId(recommendedLesson.id)
                }}
              >
                Start recommended lesson
              </button>
            </article>

            <article className="nested-card">
              <h3>Vocabulary mastery</h3>
              <p>
                You know {knownWords.length} of {vocabularyCards.length} key words.
              </p>
              <div className="progress-row compact">
                <div className="progress-track">
                  <div className="progress-fill secondary" style={{ width: `${knownWordsPercent}%` }} />
                </div>
                <span className="progress-value">{knownWordsPercent}%</span>
              </div>
              <button className="secondary-button" onClick={() => setActiveTab('practice')}>
                Practice vocabulary
              </button>
            </article>
          </div>
        </section>
      )}

      {activeTab === 'lessons' && (
        <section className="content-card">
          <h2>Lesson library</h2>
          <p className="section-hint">Complete quick checks to lock in each lesson.</p>

          <div className="lesson-grid">
            {lessons.map((lesson) => {
              const isComplete = completedLessons.includes(lesson.id)
              const isHighlighted = lesson.id === highlightedLessonId
              return (
                <article
                  key={lesson.id}
                  className={`lesson-card ${isComplete ? 'completed' : ''} ${isHighlighted ? 'highlighted' : ''}`}
                >
                  <div className="lesson-tags">
                    <span>{lesson.skill}</span>
                    <span>{lesson.difficulty}</span>
                    <span>{lesson.duration} min</span>
                  </div>
                  <h3>{lesson.title}</h3>
                  <p>{lesson.description}</p>
                  <button className="secondary-button" onClick={() => openLessonQuiz(lesson.id)}>
                    {isComplete ? 'Retake quick check' : 'Start quick check'}
                  </button>
                </article>
              )
            })}
          </div>

          {activeLesson && (
            <article className="quiz-panel">
              <h3>{activeLesson.title}: Quick check</h3>
              <p className="quiz-question">{activeLesson.question}</p>
              <div className="quiz-options">
                {activeLesson.options.map((option, index) => {
                  const isSelected = selectedAnswerIndex === index
                  const isCorrectOption = index === activeLesson.correctAnswerIndex
                  const optionClassName = [
                    'option-button',
                    isSelected ? 'selected' : '',
                    quizResult && isCorrectOption ? 'correct' : '',
                    quizResult === 'incorrect' && isSelected && !isCorrectOption ? 'wrong' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')

                  return (
                    <button key={option} className={optionClassName} onClick={() => handleAnswerSelection(index)}>
                      {option}
                    </button>
                  )
                })}
              </div>
              {quizResult && (
                <p className={quizResult === 'correct' ? 'feedback success' : 'feedback warning'}>
                  {quizResult === 'correct'
                    ? 'Correct. Great work! This lesson is now counted as completed.'
                    : 'Not quite yet. Try another option to improve your understanding.'}
                </p>
              )}
            </article>
          )}
        </section>
      )}

      {activeTab === 'practice' && (
        <section className="content-card">
          <h2>Vocabulary practice</h2>
          <p className="section-hint">Flip through practical words and mark what you already remember.</p>

          <article className="vocab-card">
            <p className="vocab-counter">
              Card {currentWordIndex + 1} of {vocabularyCards.length}
            </p>
            <h3>{currentWord.english}</h3>
            <p className="hint">{currentWord.hint}</p>
            <p className="example">"{currentWord.example}"</p>
            <div className="vocab-actions">
              <button
                className="secondary-button"
                onClick={() => setCurrentWordIndex((index) => (index === 0 ? vocabularyCards.length - 1 : index - 1))}
              >
                Previous
              </button>
              <button className="primary-button" onClick={() => markWordAsKnown(currentWord.id)}>
                {knownWords.includes(currentWord.id) ? 'Known word' : 'Mark as known'}
              </button>
              <button
                className="secondary-button"
                onClick={() => setCurrentWordIndex((index) => (index + 1) % vocabularyCards.length)}
              >
                Next
              </button>
            </div>
          </article>
        </section>
      )}

      {showSetup && (
        <div className="modal-backdrop">
          <section className="modal-card">
            <h2>Setup your learning profile</h2>
            <p>Tell us your goals so we can adapt lessons to your level.</p>
            <form className="setup-form" onSubmit={handleSaveProfile}>
              <label>
                Name
                <input
                  type="text"
                  value={draftProfile.name}
                  onChange={(event) => setDraftProfile((previous) => ({ ...previous, name: event.target.value }))}
                  placeholder="Your name"
                />
              </label>

              <label>
                Level
                <select
                  value={draftProfile.level}
                  onChange={(event) =>
                    setDraftProfile((previous) => ({ ...previous, level: event.target.value as Level }))
                  }
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </label>

              <label>
                Daily study goal (minutes)
                <input
                  type="number"
                  value={draftProfile.dailyGoal}
                  min={5}
                  max={90}
                  onChange={(event) =>
                    setDraftProfile((previous) => ({ ...previous, dailyGoal: Number(event.target.value) }))
                  }
                />
              </label>

              <label>
                Learning focus
                <select
                  value={draftProfile.focus}
                  onChange={(event) =>
                    setDraftProfile((previous) => ({
                      ...previous,
                      focus: event.target.value as UserProfile['focus'],
                    }))
                  }
                >
                  <option value="Travel">Travel</option>
                  <option value="Business">Business</option>
                  <option value="Study">Study</option>
                  <option value="Everyday conversations">Everyday conversations</option>
                </select>
              </label>

              <div className="modal-actions">
                <button type="submit" className="primary-button">
                  Save profile
                </button>
                <button type="button" className="ghost-button" onClick={handleSkipSetup}>
                  Skip for now
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {showTutorial && (
        <div className="modal-backdrop tutorial-layer">
          <section className="modal-card tutorial-card">
            <h2>Personalized quick tutorial</h2>
            <p>
              You skipped setup <strong>{skipCount}</strong> times, so here is a guided plan for{' '}
              <strong>{profile?.name ?? 'Learner'}</strong>.
            </p>
            <ol>
              <li>
                Start with <strong>{recommendedLesson.title}</strong> ({recommendedLesson.difficulty}) to match your
                current level.
              </li>
              <li>
                Reach today’s goal of <strong>{dailyGoal} minutes</strong> by completing two short lessons.
              </li>
              <li>Use the Practice tab to reinforce words after each lesson.</li>
            </ol>
            <div className="modal-actions">
              <button
                className="primary-button"
                onClick={() => {
                  closeTutorial(true)
                  setActiveTab('lessons')
                  openLessonQuiz(recommendedLesson.id)
                  setHighlightedLessonId(recommendedLesson.id)
                }}
              >
                Start guided lesson
              </button>
              <button className="ghost-button" onClick={() => closeTutorial(false)}>
                Remind me later
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

export default App
