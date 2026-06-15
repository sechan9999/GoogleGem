/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Loader2, Brain, ChevronRight, CheckCircle2, ChevronDown, Lightbulb, 
  PlayCircle, RefreshCw, Calendar, Edit3, Save, Award, 
  Sparkles, AlertCircle, ArrowLeft, BookOpen, Check, X, History, ChevronUp
} from 'lucide-react';
import { PracticeSession, InterviewQuestion, DailyScheduleItem, WeeklySchedule, EvaluationResult } from './types';

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const DEFAULT_SCHEDULE: WeeklySchedule = {
  Monday: { topic: "SQL Querying & Data Aggregations", difficulty: "Intermediate", enabled: true },
  Tuesday: { topic: "Supervised Machine Learning (Classification/Regression)", difficulty: "Intermediate", enabled: true },
  Wednesday: { topic: "Probability, Statistics & Hypothesis Testing", difficulty: "Intermediate", enabled: true },
  Thursday: { topic: "Product Metrics, Growth & A/B Testing", difficulty: "Intermediate", enabled: true },
  Friday: { topic: "Python Coding, Data Structures & Algorithms", difficulty: "Intermediate", enabled: true },
  Saturday: { topic: "Machine Learning System Design & Scaling", difficulty: "Advanced", enabled: true },
  Sunday: { topic: "Data Science Case Studies & Business Intuition", difficulty: "Intermediate", enabled: true }
};

const PRESETS = {
  generalist: {
    name: "Generalist Data Scientist",
    topics: {
      Monday: "SQL Window Functions & Database Queries",
      Tuesday: "Supervised Learning Fundamentals & Algorithms",
      Wednesday: "Probability Distributions & Hypothesis Testing",
      Thursday: "A/B Testing Setup & Product Experimentation",
      Friday: "Python Coding & Basic Algorithms",
      Saturday: "Feature Engineering & Data Preprocessing",
      Sunday: "Data Science Case Studies & Product Sense"
    }
  },
  mle: {
    name: "Machine Learning Engineer",
    topics: {
      Monday: "Gradient Descent & Optimization Methods",
      Tuesday: "Deep Learning Architectures & Neural Networks",
      Wednesday: "Feature Engineering & Dimensionality Reduction",
      Thursday: "MLOps, Model Deployment & Monitoring",
      Friday: "Data Structures & Advanced Algorithms",
      Saturday: "ML System Design for Large-Scale Recommendation",
      Sunday: "Large Language Models & Modern NLP Pipelines"
    }
  },
  analyst: {
    name: "Product / Business Analyst",
    topics: {
      Monday: "SQL Aggregations, CTEs & Subqueries",
      Tuesday: "Experimentation Pitfalls & Type I/II Errors",
      Wednesday: "Descriptive Statistics & Exploratory Data Analysis",
      Thursday: "User Retention, Cohorts & LTV Modeling",
      Friday: "Data Visualization & Dashboard Design Principles",
      Saturday: "Product Growth Metrics & Funnel Analysis",
      Sunday: "Behavioral Analytics & User Segmentation"
    }
  }
};

interface HistoryItem {
  id: string;
  date: string;
  topic: string;
  difficulty: string;
  averageScore?: number;
  questionsCompleted: number;
}

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'dashboard' | 'scheduler' | 'history'>('dashboard');

  // Core Schedule States
  const [schedule, setSchedule] = useState<WeeklySchedule>(DEFAULT_SCHEDULE);
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [editTopic, setEditTopic] = useState('');
  const [editDifficulty, setEditDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [selectedPreset, setSelectedPreset] = useState<'generalist' | 'mle' | 'analyst'>('generalist');
  const [presetDifficulty, setPresetDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');

  // Practice Session States
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  // Interactive Play States
  const [userAnswers, setUserAnswers] = useState<string[]>(Array(5).fill(''));
  const [evaluations, setEvaluations] = useState<(EvaluationResult | null)[]>(Array(5).fill(null));
  const [evaluating, setEvaluating] = useState(false);

  // History Log
  const [practiceHistory, setPracticeHistory] = useState<HistoryItem[]>([]);

  // Load schedule and history from localStorage on mount
  useEffect(() => {
    const savedSchedule = localStorage.getItem('ds_prep_schedule');
    if (savedSchedule) {
      try {
        setSchedule(JSON.parse(savedSchedule));
      } catch (e) {
        console.error("Failed to parse saved schedule", e);
      }
    }

    const savedHistory = localStorage.getItem('ds_prep_history');
    if (savedHistory) {
      try {
        setPracticeHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse saved history", e);
      }
    }
  }, []);

  const saveSchedule = (newSchedule: WeeklySchedule) => {
    setSchedule(newSchedule);
    localStorage.setItem('ds_prep_schedule', JSON.stringify(newSchedule));
  };

  const getTodayDayName = () => {
    const day = new Date().getDay();
    // 0 is Sunday, 1 is Monday, etc.
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[day];
  };

  const todayDay = getTodayDayName();
  const todaySchedule = schedule[todayDay];

  // Auto-Generate Curriculum
  const applyPresetCurriculum = () => {
    const preset = PRESETS[selectedPreset];
    const newSchedule: WeeklySchedule = {};
    DAYS_OF_WEEK.forEach(day => {
      newSchedule[day] = {
        topic: preset.topics[day as keyof typeof preset.topics],
        difficulty: presetDifficulty,
        enabled: true
      };
    });
    saveSchedule(newSchedule);
  };

  // Start edit for a day
  const handleStartEdit = (day: string) => {
    setEditingDay(day);
    setEditTopic(schedule[day].topic);
    setEditDifficulty(schedule[day].difficulty);
  };

  // Save edit for a day
  const handleSaveEdit = (day: string) => {
    const updatedSchedule = {
      ...schedule,
      [day]: {
        ...schedule[day],
        topic: editTopic.trim() || DEFAULT_SCHEDULE[day].topic,
        difficulty: editDifficulty
      }
    };
    saveSchedule(updatedSchedule);
    setEditingDay(null);
  };

  // Toggle Day enabled/disabled
  const handleToggleDay = (day: string) => {
    const updatedSchedule = {
      ...schedule,
      [day]: {
        ...schedule[day],
        enabled: !schedule[day].enabled
      }
    };
    saveSchedule(updatedSchedule);
  };

  // Generate session via endpoint
  const startPracticeSession = async (topic: string, difficulty: 'Beginner' | 'Intermediate' | 'Advanced') => {
    setLoading(true);
    setError(null);
    setSessionCompleted(false);
    setShowAnswer(false);
    setCurrentQuestionIndex(0);
    setUserAnswers(Array(5).fill(''));
    setEvaluations(Array(5).fill(null));

    try {
      const response = await fetch('/api/generate-practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, difficulty }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate practice session');
      }

      const data = await response.json();
      setSession(data);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while communicating with Gemini.');
    } finally {
      setLoading(false);
    }
  };

  // Evaluate candidate answer via endpoint
  const evaluateAnswer = async () => {
    if (!session) return;
    const currentQuestion = session.questions[currentQuestionIndex];
    const currentDraft = userAnswers[currentQuestionIndex]?.trim();
    if (!currentDraft) return;

    setEvaluating(true);
    try {
      const response = await fetch('/api/evaluate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQuestion.question,
          userAnswer: currentDraft,
          modelAnswer: currentQuestion.answer
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to evaluate answer');
      }

      const evalData: EvaluationResult = await response.json();
      const updatedEvals = [...evaluations];
      updatedEvals[currentQuestionIndex] = evalData;
      setEvaluations(updatedEvals);
      setShowAnswer(true); // Automatically reveal model answer upon evaluation
    } catch (err: any) {
      console.error(err);
      alert('Could not evaluate answer: ' + err.message);
    } finally {
      setEvaluating(false);
    }
  };

  const handleNext = () => {
    if (!session) return;
    
    if (currentQuestionIndex < session.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setShowAnswer(false);
    } else {
      // Complete Session
      const scores = evaluations.filter(e => e !== null).map(e => e!.score);
      const avgScore = scores.length > 0 ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)) : undefined;

      const historyLogItem: HistoryItem = {
        id: Math.random().toString(36).substring(2, 9),
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        topic: session.topic,
        difficulty: session.difficulty,
        averageScore: avgScore,
        questionsCompleted: session.questions.length
      };

      const updatedHistory = [historyLogItem, ...practiceHistory].slice(0, 50); // limit to 50 items
      setPracticeHistory(updatedHistory);
      localStorage.setItem('ds_prep_history', JSON.stringify(updatedHistory));
      setSessionCompleted(true);
    }
  };

  const handleTextareaChange = (val: string) => {
    const updatedAnswers = [...userAnswers];
    updatedAnswers[currentQuestionIndex] = val;
    setUserAnswers(updatedAnswers);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white pb-16">
      {/* Background Gradients for Premium Look */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-violet-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-20 w-full px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-indigo-600 to-violet-500 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-500/20">
            <Brain size={24} strokeWidth={2} className="animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">GoogleGem DS</h1>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Interview Architect</p>
          </div>
        </div>

        {!session && (
          <nav className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <span className="flex items-center gap-1.5"><PlayCircle size={15} /> Dashboard</span>
            </button>
            <button
              onClick={() => setActiveTab('scheduler')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'scheduler' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <span className="flex items-center gap-1.5"><Calendar size={15} /> Scheduler</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <span className="flex items-center gap-1.5"><History size={15} /> History</span>
            </button>
          </nav>
        )}

        {session && !sessionCompleted && (
          <div className="flex items-center gap-4">
            <div className="text-xs font-semibold text-slate-400 bg-slate-950/80 px-3 py-1.5 rounded-full border border-slate-800">
              {session.topic} • <span className={`${session.difficulty === 'Beginner' ? 'text-emerald-400' : session.difficulty === 'Intermediate' ? 'text-indigo-400' : 'text-fuchsia-400'}`}>{session.difficulty}</span>
            </div>
            <div className="text-sm font-semibold text-indigo-400 bg-indigo-950/40 px-3 py-1.5 rounded-full border border-indigo-900/50">
              Q {currentQuestionIndex + 1} of {session.questions.length}
            </div>
          </div>
        )}
      </header>

      {/* Main Body */}
      <main className="max-w-6xl mx-auto px-6 mt-8 relative z-10">
        
        {/* Loading Spinner */}
        {loading && (
          <div className="flex flex-col items-center justify-center mt-32 space-y-5">
            <div className="relative flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
              <Brain size={24} className="absolute text-indigo-400 animate-bounce" />
            </div>
            <div className="text-center">
              <p className="text-slate-300 font-bold text-lg">Consulting Gemini Expert...</p>
              <p className="text-slate-500 text-sm mt-1 max-w-sm">Generating 5 tailored interview questions and explanations at your chosen difficulty.</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-950/40 text-red-200 p-8 rounded-2xl border border-red-900/50 max-w-xl mx-auto flex flex-col items-center text-center mt-16 shadow-xl backdrop-blur-md">
            <div className="w-16 h-16 bg-red-900/30 text-red-400 rounded-full flex items-center justify-center mb-4 border border-red-500/20">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2">Practice Session Generation Failed</h3>
            <p className="text-sm text-red-300/80 mb-6">{error}</p>
            <button
              onClick={() => setSession(null)}
              className="px-6 py-2.5 bg-red-900/80 font-semibold rounded-xl hover:bg-red-800 transition-colors border border-red-700/50"
            >
              Back to Dashboard
            </button>
          </div>
        )}

        {/* Dashboard Tab */}
        {!session && !loading && !error && activeTab === 'dashboard' && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Left/Middle Panels: Today's Action */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Today's Workout Card */}
              <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 rounded-3xl p-8 shadow-xl relative overflow-hidden backdrop-blur-md">
                <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-full pointer-events-none" />
                
                <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-3">
                  <Sparkles size={14} />
                  Today's Scheduled Practice
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-slate-400 font-semibold text-lg">{todayDay}</span>
                      {todaySchedule.enabled ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-950/80 border border-indigo-800/40 text-indigo-300">Scheduled</span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-950/80 border border-slate-800/40 text-slate-400">Rest Day</span>
                      )}
                    </div>
                    <h2 className="text-3xl font-extrabold text-white leading-tight">
                      {todaySchedule.enabled ? todaySchedule.topic : "Take a Rest or Practice Custom Topic"}
                    </h2>
                    {todaySchedule.enabled && (
                      <div className="flex items-center gap-2 mt-3">
                        <span className="text-xs text-slate-400">Target Level:</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          todaySchedule.difficulty === 'Beginner' ? 'bg-emerald-950/40 border-emerald-900/60 text-emerald-400' :
                          todaySchedule.difficulty === 'Intermediate' ? 'bg-indigo-950/40 border-indigo-900/60 text-indigo-400' :
                          'bg-fuchsia-950/40 border-fuchsia-900/60 text-fuchsia-400'
                        }`}>
                          {todaySchedule.difficulty}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex-shrink-0">
                    <button
                      onClick={() => startPracticeSession(
                        todaySchedule.enabled ? todaySchedule.topic : "Data Science General Review", 
                        todaySchedule.enabled ? todaySchedule.difficulty : "Intermediate"
                      )}
                      className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-2xl active:scale-98 transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30 flex items-center justify-center gap-2 text-md"
                    >
                      <PlayCircle size={20} />
                      Start 5-Q Session
                    </button>
                  </div>
                </div>
              </div>

              {/* Custom Target Builder */}
              <div className="bg-slate-800/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl backdrop-blur-md">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <BookOpen size={18} className="text-indigo-400" />
                  Custom On-Demand Session
                </h3>
                <p className="text-slate-400 text-sm mb-6">
                  Skip the schedule and generate a customized mock interview session on any data science topic immediately.
                </p>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const topic = new FormData(form).get('customTopic') as string;
                  const diff = new FormData(form).get('customDiff') as 'Beginner' | 'Intermediate' | 'Advanced';
                  if (topic.trim()) {
                    startPracticeSession(topic.trim(), diff);
                  }
                }} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Focus Topic</label>
                      <input 
                        name="customTopic"
                        type="text" 
                        required
                        placeholder="e.g. Bias-Variance Tradeoff, Logistic Regression, CNNs" 
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:border-indigo-500 focus:outline-none text-slate-100 placeholder-slate-600 text-sm font-medium transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Difficulty Level</label>
                      <select 
                        name="customDiff"
                        defaultValue="Intermediate"
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:border-indigo-500 focus:outline-none text-slate-100 text-sm font-semibold transition-colors appearance-none cursor-pointer"
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold rounded-xl transition-all flex items-center gap-1.5"
                    >
                      <Sparkles size={16} />
                      Generate Custom Session
                    </button>
                  </div>
                </form>
              </div>

            </div>

            {/* Right Panel: Short stats & Scheduler status */}
            <div className="space-y-6">
              
              {/* Quick Curriculum View */}
              <div className="bg-slate-800/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl backdrop-blur-md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Weekly Topics</h3>
                  <button 
                    onClick={() => setActiveTab('scheduler')}
                    className="text-xs font-bold text-indigo-400 hover:text-indigo-300"
                  >
                    Edit All
                  </button>
                </div>
                <div className="space-y-3">
                  {DAYS_OF_WEEK.map((day) => {
                    const item = schedule[day];
                    const isToday = day === todayDay;
                    return (
                      <div 
                        key={day} 
                        className={`flex items-center justify-between p-3 rounded-xl border text-xs ${
                          isToday 
                            ? 'bg-indigo-950/20 border-indigo-800/60' 
                            : 'bg-slate-900/40 border-slate-800/50'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <span className={`font-bold block ${isToday ? 'text-indigo-400' : 'text-slate-300'}`}>
                            {day} {isToday && '• Today'}
                          </span>
                          <span className="text-slate-400 truncate block mt-0.5 font-medium">{item.enabled ? item.topic : "Rest Day"}</span>
                        </div>
                        {item.enabled && (
                          <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold border flex-shrink-0 ${
                            item.difficulty === 'Beginner' ? 'bg-emerald-950/50 border-emerald-900/60 text-emerald-400' :
                            item.difficulty === 'Intermediate' ? 'bg-indigo-950/50 border-indigo-900/60 text-indigo-400' :
                            'bg-fuchsia-950/50 border-fuchsia-900/60 text-fuchsia-400'
                          }`}>
                            {item.difficulty}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* Scheduler Tab */}
        {!session && !loading && !error && activeTab === 'scheduler' && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Header Description */}
            <div className="bg-slate-800/40 border border-slate-800/60 rounded-3xl p-8 backdrop-blur-md flex flex-col md:flex-row gap-8 items-start justify-between">
              <div className="max-w-xl">
                <h2 className="text-2xl font-black text-white mb-2 flex items-center gap-2">
                  <Calendar size={24} className="text-indigo-400" />
                  Interview Practice Scheduler
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Design a structured daily training plan. Gemini will automatically pull topics from your calendar to dynamically assemble customized, difficulty-specific practice sets every day.
                </p>
              </div>

              {/* Preset Curriculum Builder */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 w-full md:w-96 shadow-lg">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <Sparkles size={13} className="text-indigo-400" />
                  Auto-Gen Curriculum Curriculum
                </h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Target Role</label>
                    <select 
                      value={selectedPreset}
                      onChange={(e) => setSelectedPreset(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-semibold text-slate-200 focus:outline-none"
                    >
                      <option value="generalist">Generalist Data Scientist</option>
                      <option value="mle">Machine Learning Engineer</option>
                      <option value="analyst">Product / Business Analyst</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Difficulty Level</label>
                    <select 
                      value={presetDifficulty}
                      onChange={(e) => setPresetDifficulty(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-semibold text-slate-200 focus:outline-none"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>

                  <button
                    onClick={applyPresetCurriculum}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-97 text-white font-bold rounded-lg text-xs transition-all flex items-center justify-center gap-1 shadow-md shadow-indigo-600/10"
                  >
                    Generate Curriculum
                  </button>
                </div>
              </div>
            </div>

            {/* Weekly Days Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {DAYS_OF_WEEK.map((day) => {
                const item = schedule[day];
                const isEditing = editingDay === day;
                const isToday = day === todayDay;

                return (
                  <div 
                    key={day} 
                    className={`bg-slate-800/40 border rounded-2xl overflow-hidden transition-all shadow-md flex flex-col justify-between ${
                      isEditing 
                        ? 'border-indigo-500 shadow-indigo-500/5 ring-1 ring-indigo-500' 
                        : isToday 
                          ? 'border-indigo-800/80 bg-indigo-950/5' 
                          : 'border-slate-800/70'
                    }`}
                  >
                    {/* Day Header */}
                    <div className="px-5 py-4 border-b border-slate-800/70 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-md ${isToday ? 'text-indigo-400' : 'text-slate-200'}`}>{day}</span>
                        {isToday && <span className="bg-indigo-950 border border-indigo-900/60 text-indigo-400 text-[9px] font-extrabold px-2 py-0.5 rounded-full">TODAY</span>}
                      </div>

                      {/* Enable/Disable Toggle */}
                      <button
                        onClick={() => handleToggleDay(day)}
                        className={`text-[10px] font-extrabold px-2 py-1 rounded transition-colors ${
                          item.enabled 
                            ? 'text-indigo-400 bg-indigo-950/60 hover:bg-indigo-950' 
                            : 'text-slate-500 bg-slate-950/60 hover:bg-slate-950'
                        }`}
                      >
                        {item.enabled ? 'ACTIVE' : 'REST'}
                      </button>
                    </div>

                    {/* Day Details */}
                    <div className="p-5 flex-grow">
                      {isEditing ? (
                        <div className="space-y-3.5">
                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Topic</label>
                            <input 
                              type="text" 
                              value={editTopic}
                              onChange={(e) => setEditTopic(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg focus:border-indigo-500 focus:outline-none text-xs text-slate-200"
                              placeholder="Practice topic"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Difficulty</label>
                            <select 
                              value={editDifficulty}
                              onChange={(e) => setEditDifficulty(e.target.value as any)}
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold text-slate-200 focus:outline-none"
                            >
                              <option value="Beginner">Beginner</option>
                              <option value="Intermediate">Intermediate</option>
                              <option value="Advanced">Advanced</option>
                            </select>
                          </div>
                        </div>
                      ) : (
                        <div className={`${item.enabled ? 'opacity-100' : 'opacity-40'} space-y-3`}>
                          <p className="text-slate-300 text-sm font-semibold leading-snug line-clamp-2 h-10">
                            {item.enabled ? item.topic : "Rest & Recharge Day"}
                          </p>

                          {item.enabled ? (
                            <div className="inline-flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-400 font-semibold">Level:</span>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold border ${
                                item.difficulty === 'Beginner' ? 'bg-emerald-950/40 border-emerald-900/60 text-emerald-400' :
                                item.difficulty === 'Intermediate' ? 'bg-indigo-950/40 border-indigo-900/60 text-indigo-400' :
                                'bg-fuchsia-950/40 border-fuchsia-900/60 text-fuchsia-400'
                              }`}>
                                {item.difficulty}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500 italic block h-5">No sessions will be generated</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Footer */}
                    <div className="px-5 py-3 border-t border-slate-800/70 bg-slate-900/20 flex justify-end gap-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => setEditingDay(null)}
                            className="px-3 py-1.5 hover:bg-slate-800 rounded-lg text-xs font-semibold text-slate-400"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveEdit(day)}
                            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-md shadow-indigo-600/10 flex items-center gap-1"
                          >
                            <Save size={12} /> Save
                          </button>
                        </>
                      ) : (
                        <>
                          {item.enabled && (
                            <button
                              onClick={() => handleStartEdit(day)}
                              className="px-3 py-1.5 hover:bg-slate-800 rounded-lg text-xs font-semibold text-slate-300 flex items-center gap-1 border border-slate-800"
                            >
                              <Edit3 size={11} className="text-slate-400" /> Edit
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* History Tab */}
        {!session && !loading && !error && activeTab === 'history' && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto space-y-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                  <Award size={24} className="text-indigo-400" />
                  Your Practice Logs
                </h2>
                <p className="text-slate-400 text-sm mt-0.5">Track your conceptual performance over time evaluated by Gemini AI.</p>
              </div>

              {practiceHistory.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm("Clear all logs? This cannot be undone.")) {
                      setPracticeHistory([]);
                      localStorage.removeItem('ds_prep_history');
                    }
                  }}
                  className="text-xs font-bold text-red-400 hover:text-red-300"
                >
                  Clear Logs
                </button>
              )}
            </div>

            {practiceHistory.length === 0 ? (
              <div className="bg-slate-800/20 border border-slate-800 rounded-3xl p-12 text-center">
                <Award size={40} className="text-slate-600 mx-auto mb-4" />
                <h4 className="text-lg font-bold text-slate-300">No logs found</h4>
                <p className="text-slate-500 text-sm max-w-sm mx-auto mt-1">
                  Complete your first structured daily session to track your performance and AI evaluation scores.
                </p>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="mt-6 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md"
                >
                  Start Practicing
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {practiceHistory.map((item) => (
                  <div key={item.id} className="bg-slate-800/40 border border-slate-800/80 rounded-2xl p-5 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-slate-400 font-semibold">{item.date}</span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold border ${
                          item.difficulty === 'Beginner' ? 'bg-emerald-950/40 border-emerald-900/60 text-emerald-400' :
                          item.difficulty === 'Intermediate' ? 'bg-indigo-950/40 border-indigo-900/60 text-indigo-400' :
                          'bg-fuchsia-950/40 border-fuchsia-900/60 text-fuchsia-400'
                        }`}>
                          {item.difficulty}
                        </span>
                      </div>
                      <h4 className="text-white font-bold text-md truncate leading-snug">{item.topic}</h4>
                      <p className="text-slate-500 text-xs mt-1">Completed {item.questionsCompleted} concepts</p>
                    </div>

                    {item.averageScore !== undefined ? (
                      <div className="flex-shrink-0 text-center bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-2">
                        <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">AI Score</span>
                        <span className={`text-xl font-black ${
                          item.averageScore >= 8 ? 'text-emerald-400' :
                          item.averageScore >= 6 ? 'text-amber-400' :
                          'text-red-400'
                        }`}>
                          {item.averageScore}/10
                        </span>
                      </div>
                    ) : (
                      <div className="flex-shrink-0 text-slate-400 text-xs italic font-medium bg-slate-900/40 px-3 py-2 rounded-xl">
                        Self Evaluated
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Practice Session Active Player */}
        {session && !loading && (
          <AnimatePresence mode="wait">
            {!sessionCompleted ? (
              <motion.div
                key="session-player"
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.99 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8"
              >
                {/* Left Panel: Active Question & User Input (7 cols) */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* Question Container */}
                  <div className="bg-slate-800/50 border border-slate-850 rounded-3xl p-8 shadow-xl backdrop-blur-md">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-400">
                        Interview Question {currentQuestionIndex + 1} of 5
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                        session.difficulty === 'Beginner' ? 'bg-emerald-950/40 border-emerald-900/60 text-emerald-400' :
                        session.difficulty === 'Intermediate' ? 'bg-indigo-950/40 border-indigo-900/60 text-indigo-400' :
                        'bg-fuchsia-950/40 border-fuchsia-900/60 text-fuchsia-400'
                      }`}>
                        {session.difficulty}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-white leading-relaxed mb-6">
                      {session.questions[currentQuestionIndex].question}
                    </h3>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mb-2">
                      <div 
                        className="bg-indigo-500 h-2 transition-all duration-300"
                        style={{ width: `${((currentQuestionIndex + 1) / 5) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* User Response Form */}
                  <div className="bg-slate-800/40 border border-slate-850 rounded-3xl p-6 shadow-xl backdrop-blur-md space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Draft Your Response
                      </label>
                      {evaluations[currentQuestionIndex] && (
                        <span className="text-xs text-indigo-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 size={13} /> Evaluated
                        </span>
                      )}
                    </div>
                    
                    <textarea
                      value={userAnswers[currentQuestionIndex]}
                      onChange={(e) => handleTextareaChange(e.target.value)}
                      placeholder="Type your explanation, math steps, SQL queries, or machine learning considerations here..."
                      className="w-full min-h-48 px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl focus:border-indigo-500 focus:outline-none text-slate-100 placeholder-slate-600 text-sm leading-relaxed font-medium transition-colors"
                      disabled={evaluating}
                    />

                    <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
                      <p className="text-xs text-slate-500 italic text-center sm:text-left">
                        {userAnswers[currentQuestionIndex].trim().length > 10 
                          ? "Ready for evaluation. Submit below." 
                          : "Tip: Write as much detail as possible to receive a deeper AI audit."
                        }
                      </p>

                      <div className="flex gap-3 w-full sm:w-auto">
                        <button
                          onClick={evaluateAnswer}
                          disabled={evaluating || !userAnswers[currentQuestionIndex].trim()}
                          className="flex-grow sm:flex-grow-0 px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {evaluating ? (
                            <>
                              <Loader2 size={14} className="animate-spin" /> Evaluating...
                            </>
                          ) : (
                            <>
                              <Sparkles size={14} /> Submit to AI
                            </>
                          )}
                        </button>

                        {!showAnswer && (
                          <button
                            onClick={() => setShowAnswer(true)}
                            className="flex-grow sm:flex-grow-0 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold rounded-xl text-xs transition-colors"
                          >
                            Skip & Reveal
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* AI Evaluation Result Card */}
                  {evaluations[currentQuestionIndex] && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-slate-800/80 border border-indigo-950/60 rounded-3xl p-6 shadow-xl backdrop-blur-md relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-500/5 to-transparent rounded-full pointer-events-none" />
                      
                      <div className="flex items-center justify-between border-b border-slate-750 pb-4 mb-4">
                        <div className="flex items-center gap-2">
                          <div className="bg-indigo-950/60 p-1.5 rounded-lg border border-indigo-800/40 text-indigo-400">
                            <Sparkles size={16} />
                          </div>
                          <span className="text-sm font-bold text-white">Gemini Assessment</span>
                        </div>
                        
                        <div className="flex items-center gap-1 bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-1">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mr-1">Score:</span>
                          <span className={`text-md font-black ${
                            evaluations[currentQuestionIndex]!.score >= 8 ? 'text-emerald-400' :
                            evaluations[currentQuestionIndex]!.score >= 6 ? 'text-amber-400' :
                            'text-red-400'
                          }`}>
                            {evaluations[currentQuestionIndex]!.score}/10
                          </span>
                        </div>
                      </div>

                      <div className="space-y-4 text-xs leading-relaxed font-medium">
                        <div>
                          <h5 className="font-bold text-indigo-300 uppercase tracking-wider text-[10px] mb-1.5 flex items-center gap-1">
                            <Check size={12} className="text-emerald-400" /> Key Observations
                          </h5>
                          <p className="text-slate-300 pl-4">{evaluations[currentQuestionIndex]!.feedback}</p>
                        </div>
                        <div>
                          <h5 className="font-bold text-violet-300 uppercase tracking-wider text-[10px] mb-1.5 flex items-center gap-1">
                            <AlertCircle size={12} className="text-amber-400" /> Actionable Improvements
                          </h5>
                          <p className="text-slate-300 pl-4">{evaluations[currentQuestionIndex]!.suggestions}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                </div>

                {/* Right Panel: Model Solution, Explanations, Tips (5 cols) */}
                <div className="lg:col-span-5">
                  <AnimatePresence mode="wait">
                    {showAnswer ? (
                      <motion.div
                        key="answer-visible"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6 sticky top-24"
                      >
                        {/* Model Answer Box */}
                        <div className="bg-slate-850 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
                            <CheckCircle2 size={13} className="text-indigo-400" /> Ideal Model Answer
                          </h4>
                          <p className="text-slate-200 text-xs font-medium leading-relaxed whitespace-pre-wrap">
                            {session.questions[currentQuestionIndex].answer}
                          </p>
                        </div>

                        {/* Concept Explanation Box */}
                        <div className="bg-slate-850 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
                            <BookOpen size={13} className="text-violet-400" /> Detailed Explanation
                          </h4>
                          <p className="text-slate-300 text-xs font-medium leading-relaxed whitespace-pre-wrap">
                            {session.questions[currentQuestionIndex].explanation}
                          </p>
                        </div>

                        {/* Pro Interview Advice */}
                        <div className="bg-amber-950/20 border border-amber-900/40 rounded-3xl p-5 flex gap-3.5 shadow-xl relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-500/5 to-transparent rounded-full pointer-events-none" />
                          <div className="text-amber-500 mt-0.5 flex-shrink-0 bg-amber-950/60 p-2 rounded-lg h-fit border border-amber-900/30">
                            <Lightbulb size={20} />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-amber-300 text-xs uppercase tracking-wider mb-1">Interview Tip</h4>
                            <p className="text-amber-200/90 text-[11px] leading-relaxed font-medium">
                              {session.questions[currentQuestionIndex].tips}
                            </p>
                          </div>
                        </div>

                        {/* Navigation Actions */}
                        <div className="flex justify-end pt-2">
                          <button
                            onClick={handleNext}
                            className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1 text-xs"
                          >
                            {currentQuestionIndex < session.questions.length - 1 ? 'Next Question' : 'Complete Practice Session'}
                            <ChevronRight size={15} />
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="bg-slate-800/10 border-2 border-dashed border-slate-800/60 rounded-3xl p-8 text-center flex flex-col justify-center items-center h-80 sticky top-24">
                        <div className="bg-slate-900 border border-slate-800 p-4 rounded-full text-slate-500 mb-4 animate-pulse">
                          <Lightbulb size={32} />
                        </div>
                        <h4 className="text-sm font-bold text-slate-400">Solution Locked</h4>
                        <p className="text-xs text-slate-600 max-w-[240px] mt-1.5 mx-auto leading-relaxed">
                          Draft your response on the left and submit it to the AI assessor or click "Reveal" to inspect the model answer and interview tips.
                        </p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ) : (
              // Session Completed Screen
              <motion.div
                key="completion-view"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-2xl mx-auto flex flex-col items-center text-center mt-8 bg-slate-800/30 border border-slate-800 p-12 rounded-3xl shadow-xl backdrop-blur-md relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-500/5 to-transparent rounded-full pointer-events-none" />
                
                <div className="w-20 h-20 bg-indigo-950/60 border border-indigo-800/40 text-indigo-400 rounded-full flex items-center justify-center mb-6 shadow-inner">
                  <Award size={40} className="animate-bounce" />
                </div>
                
                <h2 className="text-3xl font-black text-white mb-2">Practice Session Finished!</h2>
                <p className="text-slate-400 text-sm mb-6 uppercase tracking-wider font-extrabold">{session.topic}</p>
                
                <p className="text-slate-300 text-sm leading-relaxed mb-8 max-w-md">
                  Excellent work tackling these 5 key Data Science concepts. Reflecting on the model answers and adjusting your terminology is the single most effective way to excel in live panel loops.
                </p>

                {/* Score Summary if Evaluated */}
                {evaluations.some(e => e !== null) && (
                  <div className="bg-slate-950/80 border border-slate-850 rounded-2xl p-5 mb-8 w-full max-w-sm flex justify-around items-center">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-0.5">Concepts Assessed</span>
                      <span className="text-2xl font-black text-white">
                        {evaluations.filter(e => e !== null).length} / 5
                      </span>
                    </div>

                    <div className="border-l border-slate-800 h-10" />

                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-0.5">Average Score</span>
                      <span className="text-2xl font-black text-indigo-400">
                        {(evaluations.filter(e => e !== null).map(e => e!.score).reduce((a, b) => a + b, 0) / evaluations.filter(e => e !== null).length).toFixed(1)} / 10
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex gap-4 w-full sm:w-auto">
                  <button
                    onClick={() => setActiveTab('history')}
                    className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition-colors flex items-center gap-1.5"
                  >
                    View History
                  </button>
                  <button
                    onClick={() => {
                      setSession(null);
                      setActiveTab('dashboard');
                    }}
                    className="px-7 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5"
                  >
                    Return to Dashboard
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}

      </main>
    </div>
  );
}
