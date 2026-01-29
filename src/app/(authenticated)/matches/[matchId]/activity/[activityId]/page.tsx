'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { startActivity, completeActivity, getAvailableActivities, Activity, ActivityInstance } from '@/lib/api';

const ACTIVITY_ICONS: Record<string, string> = {
  icebreaker: '🎯',
  conversation: '💬',
  quiz: '🎮',
  game: '🎲',
  creative: '🎨',
};

const ACTIVITY_COLORS: Record<string, string> = {
  icebreaker: 'from-orange-400 to-pink-500',
  conversation: 'from-blue-400 to-purple-500',
  quiz: 'from-green-400 to-teal-500',
  game: 'from-yellow-400 to-orange-500',
  creative: 'from-pink-400 to-purple-500',
};

export default function ActivityPage() {
  const params = useParams<{ matchId: string; activityId: string }>();
  const { matchId, activityId } = params;
  const router = useRouter();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [instance, setInstance] = useState<ActivityInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    loadActivity();
  }, [activityId]);

  const loadActivity = async () => {
    try {
      const response = await getAvailableActivities();
      const found = response.data.find((a: Activity) => a.id === activityId);
      if (found) {
        setActivity(found);
      }
    } catch (error) {
      console.error('Failed to load activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    try {
      const response = await startActivity(matchId!, activityId!);
      setInstance(response.data.instance);
      setCurrentStep(1);
    } catch (error) {
      console.error('Failed to start activity:', error);
    }
  };

  const handleComplete = async () => {
    if (!instance) return;

    setCompleting(true);
    try {
      await completeActivity(instance.id, { answers });
      router.push(`/matches/${matchId}`);
    } catch (error) {
      console.error('Failed to complete activity:', error);
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card animate-pulse">
          <div className="flex items-center gap-4 mb-6">
            <div className="skeleton w-16 h-16 rounded-2xl" />
            <div className="flex-1 space-y-3">
              <div className="skeleton h-6 w-48" />
              <div className="skeleton h-4 w-24" />
            </div>
            <div className="skeleton h-10 w-20 rounded-xl" />
          </div>
          <div className="space-y-3">
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="card text-center py-16 animate-fade-in">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-gray-500 mb-4">Activity not found</p>
        <button onClick={() => router.push(`/matches/${matchId}`)} className="btn-secondary">
          Back to Chat
        </button>
      </div>
    );
  }

  const questions = (activity.config?.questions as Array<{ question: string; options?: string[] }>) || [];
  const bgColor = ACTIVITY_COLORS[activity.type] || 'from-primary-400 to-secondary-500';

  return (
    <div className="max-w-2xl mx-auto">
      {/* Activity Header */}
      <div className="card mb-6 overflow-hidden animate-slide-up">
        <div className={`-mx-6 -mt-6 mb-6 p-6 bg-gradient-to-r ${bgColor}`}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
              <span className="text-4xl">
                {ACTIVITY_ICONS[activity.type] || '🎯'}
              </span>
            </div>
            <div className="flex-1 text-white">
              <h1 className="text-2xl font-bold">{activity.name}</h1>
              <p className="text-white/80 capitalize">{activity.type}</p>
            </div>
            <div className="bg-white/20 backdrop-blur rounded-xl px-4 py-2 text-center">
              <div className="text-2xl font-bold text-white">+{activity.intimacy_points}</div>
              <div className="text-xs text-white/80">points</div>
            </div>
          </div>
        </div>

        <p className="text-gray-600 mb-4">{activity.description}</p>

        {activity.instructions && (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="font-medium text-gray-700">Instructions</h3>
            </div>
            <p className="text-sm text-gray-600 whitespace-pre-line">
              {activity.instructions}
            </p>
          </div>
        )}
      </div>

      {/* Step 0: Start */}
      {currentStep === 0 && (
        <div className="card text-center py-10 animate-bounce-in">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center">
            <svg className="w-10 h-10 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Ready to start?</h2>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            Complete this activity together to earn{' '}
            <span className="font-semibold text-primary-600">{activity.intimacy_points}</span>{' '}
            intimacy points!
          </p>
          <button onClick={handleStart} className="btn-primary px-8">
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              </svg>
              Start Activity
            </span>
          </button>
        </div>
      )}

      {/* Step 1: Questions */}
      {currentStep === 1 && questions.length > 0 && (
        <div className="card animate-slide-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Answer the questions</h2>
              <p className="text-sm text-gray-500">{questions.length} questions to complete</p>
            </div>
          </div>

          <div className="space-y-6">
            {questions.map((q, index) => (
              <div key={index} className="animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                <p className="font-medium text-gray-800 mb-3">
                  <span className="text-primary-500 mr-2">Q{index + 1}.</span>
                  {typeof q === 'string' ? q : q.question}
                </p>
                {typeof q === 'object' && q.options ? (
                  <div className="space-y-2">
                    {q.options.map((option: string) => (
                      <button
                        key={option}
                        onClick={() => setAnswers({ ...answers, [index]: option })}
                        className={`w-full p-4 rounded-xl text-left transition-all duration-200 ${
                          answers[index] === option
                            ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white scale-[1.02]'
                            : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                        }`}
                        style={answers[index] === option ? { boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' } : undefined}
                      >
                        <span className="flex items-center gap-3">
                          <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            answers[index] === option ? 'border-white bg-white' : 'border-gray-300'
                          }`}>
                            {answers[index] === option && (
                              <span className="w-2.5 h-2.5 rounded-full bg-primary-500" />
                            )}
                          </span>
                          {option}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <textarea
                    value={answers[index] || ''}
                    onChange={(e) => setAnswers({ ...answers, [index]: e.target.value })}
                    className="input min-h-[100px] resize-none"
                    placeholder="Type your answer..."
                  />
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 flex gap-3">
            <button
              onClick={() => router.push(`/matches/${matchId}`)}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              onClick={handleComplete}
              disabled={completing}
              className="btn-primary flex-1"
            >
              {completing ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Completing...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Complete Activity
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 1: No questions, just completion */}
      {currentStep === 1 && questions.length === 0 && (
        <div className="card text-center py-10 animate-bounce-in">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-100 to-teal-100 flex items-center justify-center animate-pulse-soft">
            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Activity in Progress</h2>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            Follow the instructions above with your match, then mark as complete!
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push(`/matches/${matchId}`)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleComplete}
              disabled={completing}
              className="btn-primary"
            >
              {completing ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Completing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Mark as Complete
                </span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
