/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Brain, ChevronRight, CheckCircle2, ChevronDown, Lightbulb, PlayCircle, RefreshCw } from 'lucide-react';
import { PracticeSession, InterviewQuestion } from './types';

export default function App() {
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  const fetchSession = async () => {
    setLoading(true);
    setError(null);
    setSessionCompleted(false);
    setShowAnswer(false);
    setCurrentQuestionIndex(0);

    try {
      const response = await fetch('/api/generate-practice', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate practice session');
      }

      const data = await response.json();
      setSession(data);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (!session) return;
    
    if (currentQuestionIndex < session.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setShowAnswer(false);
    } else {
      setSessionCompleted(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 w-full px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-lg text-white">
            <Brain size={24} strokeWidth={2.5} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">DS Prep Co.</h1>
        </div>
        {session && !sessionCompleted && (
          <div className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
            Question {currentQuestionIndex + 1} of {session.questions.length}
          </div>
        )}
      </header>

      <main className="max-w-4xl mx-auto p-6 mt-8">
        {!session && !loading && !error && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center text-center mt-20 space-y-6"
          >
            <div className="w-24 h-24 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
              <PlayCircle size={48} strokeWidth={1.5} />
            </div>
            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">Data Science Daily Practice</h2>
            <p className="text-lg text-slate-600 max-w-xl">
              Sharpen your skills for your next Data Science interview. Get a daily topic and practice with expert-level questions and model answers.
            </p>
            <button
              onClick={fetchSession}
              className="mt-8 px-8 py-4 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 active:scale-95 transition-all shadow-md hover:shadow-lg flex items-center gap-2 text-lg"
            >
              <RefreshCw size={20} />
              Generate Today's Practice
            </button>
          </motion.div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center mt-32 space-y-4">
            <Loader2 size={48} className="text-indigo-600 animate-spin" />
            <p className="text-slate-500 font-medium animate-pulse">Generating your custom practice session...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-700 p-6 rounded-xl border border-red-200 flex flex-col items-center text-center mt-20">
            <h3 className="text-xl font-bold mb-2">Something went wrong</h3>
            <p className="mb-6">{error}</p>
            <button
              onClick={fetchSession}
              className="px-6 py-2 bg-red-100 font-medium rounded-lg hover:bg-red-200 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {session && !loading && (
          <AnimatePresence mode="wait">
            {!sessionCompleted ? (
              <motion.div
                key="practice-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-2 text-indigo-600 text-sm font-bold uppercase tracking-wider mb-2">
                    <CheckCircle2 size={16} />
                    Today's Topic
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">{session.topic}</h2>
                  <p className="text-slate-600 leading-relaxed">{session.description}</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-8">
                    <h3 className="text-xl font-semibold text-slate-900 mb-6 leading-snug">
                      <span className="text-indigo-600 mr-2">Q:</span> 
                      {session.questions[currentQuestionIndex].question}
                    </h3>

                    {!showAnswer ? (
                      <div className="border-t border-slate-100 pt-6 mt-4 flex flex-col items-center">
                        <p className="text-slate-500 italic mb-6">Take a moment to formulate your answer, then review the solution.</p>
                        <button
                          onClick={() => setShowAnswer(true)}
                          className="px-6 py-3 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-2"
                        >
                          <ChevronDown size={18} />
                          Reveal Answer
                        </button>
                      </div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-6 border-t border-slate-100 pt-6 mt-4"
                      >
                        <div className="prose prose-slate max-w-none">
                          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Model Answer</h4>
                          <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">{session.questions[currentQuestionIndex].answer}</p>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex gap-4 mt-6">
                          <div className="text-amber-500 mt-1 flex-shrink-0">
                            <Lightbulb size={24} />
                          </div>
                          <div>
                            <h4 className="font-semibold text-amber-900 mb-1">Interview Tip</h4>
                            <p className="text-amber-800 text-sm leading-relaxed">{session.questions[currentQuestionIndex].tips}</p>
                          </div>
                        </div>

                        <div className="flex justify-end pt-4">
                          <button
                            onClick={handleNext}
                            className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2"
                          >
                            {currentQuestionIndex < session.questions.length - 1 ? 'Next Question' : 'Complete Session'}
                            <ChevronRight size={18} />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="completion-view"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center text-center mt-20 bg-white p-12 rounded-3xl border border-slate-200 shadow-sm"
              >
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 size={40} strokeWidth={2.5} />
                </div>
                <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-4">Session Complete!</h2>
                <p className="text-slate-600 text-lg mb-8 max-w-md">
                  Great job practicing your Data Science fundamentals on <span className="font-semibold text-slate-800">{session.topic}</span> today. 
                </p>
                <button
                  onClick={fetchSession}
                  className="px-8 py-4 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-2"
                >
                  <RefreshCw size={18} />
                  Start Another Session
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}
