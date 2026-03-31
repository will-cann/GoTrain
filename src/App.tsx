import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { BrowserRouter as Router, Routes, Route, NavLink, Link } from 'react-router-dom';
import {
  Settings as SettingsIcon,
  RefreshCw,
  CheckCircle2,
  Send,
  History,
  LayoutDashboard,
  AlertCircle,
  ArrowRight,
  MessageSquare
} from 'lucide-react';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { SettingsModal } from './components/SettingsModal';
import { GoalForm } from './components/GoalForm';
import type { UserGoals } from './components/GoalForm';
import { getStravaAuthUrl, exchangeToken, refreshToken, getRecentActivities } from './services/strava';
import type { StravaActivity } from './services/strava';
import { generateWorkoutSuggestions, handleCoachChat } from './services/openai';
import { WorkoutPlan, type WeeklyPlan } from './components/WorkoutPlan';
import { ActivityHistory } from './components/ActivityHistory';
import { AskCoach, type ChatMessage } from './components/AskCoach';
import { fetchHevyWorkouts, calculateExerciseStats, type ExerciseStats } from './services/hevy';
import { motion, AnimatePresence } from 'framer-motion';
import { SubwayLogo, SubwayHero } from './components/SubwayLogo';

function Dashboard() {
  const { isConfigured, stravaClientId, stravaClientSecret, openAiApiKey, hevyApiKey, distanceUnit, weightUnit, useProxy } = useSettings();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCoachOpen, setIsCoachOpen] = useState(false);
  const [userGoals, setUserGoals] = useState<UserGoals | undefined>(() => {
    const saved = localStorage.getItem('workoutBinderUserGoals');
    if (!saved) return undefined;
    const parsed = JSON.parse(saved);
    if (!parsed.preferredActivities && parsed.preferredActivity) {
      parsed.preferredActivities = [parsed.preferredActivity];
      delete parsed.preferredActivity;
    }
    return parsed;
  });

  const [stravaToken, setStravaToken] = useState<string | null>(() => {
    return localStorage.getItem('strava_access_token');
  });

  const [activities, setActivities] = useState<StravaActivity[]>(() => {
    const saved = localStorage.getItem('workoutBinderActivities');
    return saved ? JSON.parse(saved) : [];
  });
  const [suggestions, setSuggestions] = useState<string | null>(() => {
    return localStorage.getItem('workoutBinderSuggestions');
  });
  const [parsedPlan, setParsedPlan] = useState<WeeklyPlan | null>(() => {
    const saved = localStorage.getItem('workoutBinderSuggestions');
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('workoutBinderChatMessages');
    return saved ? JSON.parse(saved) : [];
  });
  const [exerciseStats, setExerciseStats] = useState<ExerciseStats[]>([]);

  const isDemoMode = useProxy && !stravaToken;

  useEffect(() => {
    localStorage.setItem('workoutBinderChatMessages', JSON.stringify(chatMessages));
  }, [chatMessages]);

  // Auto-load demo Strava data in proxy mode
  useEffect(() => {
    if (isDemoMode && activities.length === 0) {
      fetchDemoActivities();
    }
  }, [isDemoMode]);

  const fetchDemoActivities = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/demo-activities');
      if (!res.ok) throw new Error('Failed to load activities');
      const data: StravaActivity[] = await res.json();
      setActivities(data);
      localStorage.setItem('workoutBinderActivities', JSON.stringify(data));
    } catch (err) {
      console.error('Failed to fetch demo activities', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code && isConfigured) {
      const handleOAuth = async () => {
        setLoading(true);
        try {
          const data = await exchangeToken(stravaClientId, stravaClientSecret, code, useProxy);
          saveStravaTokens(data);
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (err: any) {
          setError('Failed to connect to Strava: ' + err.message);
        } finally {
          setLoading(false);
        }
      };
      handleOAuth();
    }
  }, [isConfigured, stravaClientId, stravaClientSecret]);

  const saveStravaTokens = (data: any) => {
    localStorage.setItem('strava_access_token', data.access_token);
    localStorage.setItem('strava_refresh_token', data.refresh_token);
    localStorage.setItem('strava_expires_at', data.expires_at.toString());
    setStravaToken(data.access_token);
  };

  const getValidToken = async () => {
    const accessToken = localStorage.getItem('strava_access_token');
    const refresh = localStorage.getItem('strava_refresh_token');
    const expiresAt = localStorage.getItem('strava_expires_at');

    if (!accessToken || !refresh || !expiresAt) return null;

    const now = Math.floor(Date.now() / 1000);
    if (now < parseInt(expiresAt) - 60) {
      return accessToken;
    }

    try {
      const data = await refreshToken(stravaClientId, stravaClientSecret, refresh, useProxy);
      saveStravaTokens(data);
      return data.access_token;
    } catch (err) {
      console.error('Failed to refresh token', err);
      handleDisconnectStrava();
      return null;
    }
  };

  const handleSaveGoals = (goals: UserGoals) => {
    setUserGoals(goals);
    localStorage.setItem('workoutBinderUserGoals', JSON.stringify(goals));
  };

  const handleConnectStrava = async () => {
    if (!isConfigured) {
      setIsSettingsOpen(true);
      return;
    }
    const redirectUri = window.location.origin;
    const url = await getStravaAuthUrl(stravaClientId, redirectUri, useProxy);
    window.location.href = url;
  };

  const handleGeneratePlan = async () => {
    if (!userGoals || (!openAiApiKey && !useProxy)) return;

    setLoading(true);
    setError(null);
    try {
      let recentActivities = activities;

      if (stravaToken) {
        const token = await getValidToken();
        if (token) {
          recentActivities = await getRecentActivities(token, useProxy);
        }
      } else if (isDemoMode) {
        // Fetch fresh demo activities
        const res = await fetch('/api/demo-activities');
        if (res.ok) {
          recentActivities = await res.json();
        }
      }

      setActivities(recentActivities);
      localStorage.setItem('workoutBinderActivities', JSON.stringify(recentActivities));

      if (recentActivities.length === 0) {
        setError('No activity data available.');
        setLoading(false);
        return;
      }

      let fetchedStats: ExerciseStats[] = [];
      if (hevyApiKey || useProxy) {
        try {
          const hevyWorkouts = await fetchHevyWorkouts(hevyApiKey, 1, 5, useProxy);
          fetchedStats = calculateExerciseStats(hevyWorkouts);
          setExerciseStats(fetchedStats);
        } catch (err) {
          console.error('Failed to fetch Hevy data', err);
        }
      }

      const units = { distance: distanceUnit, weight: weightUnit };
      const currentDate = new Date().toISOString().split('T')[0];
      const workoutPlan = await generateWorkoutSuggestions(openAiApiKey, userGoals, recentActivities, units, fetchedStats, currentDate, useProxy);
      setSuggestions(workoutPlan);
      localStorage.setItem('workoutBinderSuggestions', workoutPlan);

      try {
        const parsed = JSON.parse(workoutPlan);
        setParsedPlan(parsed);
      } catch (err) {
        console.error('Failed to parse workout plan JSON', err);
      }
    } catch (err: any) {
      setError('Error generating plan: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshWorkouts = async () => {
    setLoading(true);
    setError(null);
    try {
      let latestActivities: StravaActivity[];

      if (stravaToken) {
        const token = await getValidToken();
        if (!token) {
          setError('Please connect to Strava first.');
          return;
        }
        latestActivities = await getRecentActivities(token, useProxy);
      } else if (isDemoMode) {
        const res = await fetch('/api/demo-activities');
        if (!res.ok) throw new Error('Failed to refresh activities');
        latestActivities = await res.json();
      } else {
        setError('Please connect to Strava first.');
        return;
      }

      setActivities(latestActivities);
      localStorage.setItem('workoutBinderActivities', JSON.stringify(latestActivities));
    } catch (err: any) {
      setError('Failed to refresh activities: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnectStrava = () => {
    localStorage.removeItem('strava_access_token');
    localStorage.removeItem('strava_refresh_token');
    localStorage.removeItem('strava_expires_at');
    localStorage.removeItem('workoutBinderActivities');
    localStorage.removeItem('workoutBinderSuggestions');
    localStorage.removeItem('workoutBinderChatMessages');
    setStravaToken(null);
    setActivities([]);
    setSuggestions(null);
    setParsedPlan(null);
    setChatMessages([]);
  };

  const handleSendMessage = async (content: string) => {
    if (!openAiApiKey && !useProxy) return;

    const newUserMessage: ChatMessage = { role: 'user', content };
    const updatedMessages = [...chatMessages, newUserMessage];
    setChatMessages(updatedMessages);
    setChatLoading(true);

    try {
      const coachResponse = await handleCoachChat(
        openAiApiKey,
        updatedMessages as any,
        userGoals!,
        activities,
        parsedPlan,
        { distance: distanceUnit, weight: weightUnit },
        exerciseStats,
        new Date().toISOString().split('T')[0],
        useProxy
      );

      let finalContent = coachResponse;

      const planMatch = coachResponse.match(/<REVISED_PLAN>([\s\S]*?)<\/REVISED_PLAN>/);
      if (planMatch) {
        try {
          let newPlanJson = planMatch[1].trim();
          if (newPlanJson.startsWith('```')) {
            newPlanJson = newPlanJson.replace(/^```[a-z]*\n/i, '').replace(/\n```$/i, '').trim();
          }
          const newParsedPlan = JSON.parse(newPlanJson);
          setParsedPlan(newParsedPlan);
          setSuggestions(newPlanJson);
          localStorage.setItem('workoutBinderSuggestions', newPlanJson);

          finalContent = coachResponse.replace(/<REVISED_PLAN>[\s\S]*?<\/REVISED_PLAN>/, 'Plan updated.');
        } catch (e) {
          console.error('Failed to parse revised plan', e);
        }
      }

      setChatMessages((prev: ChatMessage[]) => [...prev, { role: 'assistant', content: finalContent }]);
    } catch (err: any) {
      setError('Chat Error: ' + err.message);
    } finally {
      setChatLoading(false);
    }
  };

  const handleCopyPlan = async () => {
    if (!suggestions) return;
    try {
      await navigator.clipboard.writeText(suggestions);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleEditDay = (dayNumber: number, activityType: string) => {
    const editPrompt = `I'd like to edit Day ${dayNumber} (${activityType}).`;

    // Open coach panel if closed
    if (!isCoachOpen) setIsCoachOpen(true);

    if (chatMessages.length > 0 && chatMessages[chatMessages.length - 1].content === editPrompt) {
      return;
    }

    handleSendMessage(editPrompt);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Nav */}
      <nav className="border-b border-edge z-40 bg-[#0a0a0a]/90 backdrop-blur-sm shrink-0">
        <div className="px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <Link to="/" className="flex items-center gap-2.5 group">
              <SubwayLogo size={24} />
              <span className="text-lg font-bold tracking-[-0.02em] text-chalk group-hover:text-accent transition-colors">
                Train
              </span>
            </Link>

            {isConfigured && (
              <div className="hidden md:flex items-center gap-1">
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] transition-colors ${isActive
                      ? 'text-chalk border-b-2 border-accent'
                      : 'text-muted hover:text-chalk'
                    }`
                  }
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Plan
                </NavLink>
                <NavLink
                  to="/history"
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] transition-colors ${isActive
                      ? 'text-chalk border-b-2 border-accent'
                      : 'text-muted hover:text-chalk'
                    }`
                  }
                >
                  <History className="w-3.5 h-3.5" />
                  History
                </NavLink>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            {isConfigured && (
              <button
                onClick={() => setIsCoachOpen(!isCoachOpen)}
                className={`flex items-center gap-2 p-2 transition-colors ${isCoachOpen ? 'text-accent' : 'text-muted hover:text-chalk'}`}
                aria-label={isCoachOpen ? 'Close coach panel' : 'Open coach panel'}
              >
                <MessageSquare className="w-5 h-5" />
                <span className="hidden sm:inline text-[0.6875rem] font-semibold uppercase tracking-[0.14em]">
                  Coach
                </span>
              </button>
            )}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-muted hover:text-chalk transition-colors"
              aria-label="Open settings"
            >
              <SettingsIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Body: main content + coach sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main scrollable area */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
            {error && (
              <div className="mb-6 px-4 py-3 border border-red-500/30 bg-red-500/5 flex items-center gap-3 text-red-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p className="text-sm flex-1">{error}</p>
                <button onClick={() => setError(null)} className="text-red-400/60 hover:text-red-400 transition-colors p-1" aria-label="Dismiss error">
                  <span className="text-lg leading-none">&times;</span>
                </button>
              </div>
            )}
            <Routes>
              <Route path="/history" element={
                <ActivityHistory
                  activities={activities}
                  distanceUnit={distanceUnit}
                  onRefresh={handleRefreshWorkouts}
                  isRefreshing={loading}
                />
              } />
              <Route path="/" element={
                <>
                  {!isConfigured ? (
                    <div className="flex flex-col items-center justify-center py-32 text-center">
                      <span className="label-caps text-muted mb-8">Welcome to</span>
                      <div className="mb-8">
                        <SubwayHero />
                      </div>
                      <p className="text-dim max-w-[42ch] text-lg mb-12 leading-[1.7]">
                        AI-driven training plans built from your real data. Connect Strava, set your goals, get moving.
                      </p>
                      <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="group flex items-center gap-3 bg-accent hover:bg-accent-hover text-black font-semibold text-[0.8125rem] uppercase tracking-[0.12em] px-8 py-4 transition-all"
                      >
                        Configure APIs
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                      {/* Left Column: Goals & Inputs */}
                      <div className="lg:col-span-1 space-y-6">
                        <GoalForm onSave={handleSaveGoals} savedGoals={userGoals} />

                        <div className="border border-edge bg-surface p-6">
                          <h2 className="label-caps mb-6">Data Sources</h2>
                          {isDemoMode ? (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between py-3 border-b border-edge">
                                <div className="flex items-center gap-3 text-[#FC4C02]">
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span className="label-caps text-[#FC4C02]">Strava</span>
                                </div>
                                <button
                                  onClick={fetchDemoActivities}
                                  disabled={loading}
                                  className="label-caps text-muted hover:text-chalk transition-colors flex items-center gap-1.5"
                                >
                                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                                  Sync
                                </button>
                              </div>
                              {activities.length > 0 && (
                                <Link to="/history" className="block py-3 border-b border-edge hover:border-chalk transition-colors group">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="label-caps">Last 7 Days</span>
                                    <ArrowRight className="w-3 h-3 text-muted group-hover:text-chalk group-hover:translate-x-0.5 transition-all" />
                                  </div>
                                  <div className="text-2xl font-bold text-chalk tracking-[-0.02em] tabular">{activities.length} <span className="text-dim text-base font-normal">workouts</span></div>
                                </Link>
                              )}
                            </div>
                          ) : !stravaToken ? (
                            <button
                              onClick={handleConnectStrava}
                              disabled={loading}
                              className="w-full bg-[#FC4C02] hover:bg-[#e64400] text-black font-semibold text-[0.8125rem] uppercase tracking-[0.12em] py-3 px-6 flex items-center justify-center gap-3 transition-colors disabled:opacity-50"
                            >
                              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                              Connect Strava
                            </button>
                          ) : (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between py-3 border-b border-edge">
                                <div className="flex items-center gap-3 text-[#FC4C02]">
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span className="label-caps text-[#FC4C02]">Strava Connected</span>
                                </div>
                                <button
                                  onClick={handleDisconnectStrava}
                                  className="label-caps hover:text-red-400 transition-colors"
                                >
                                  Disconnect
                                </button>
                              </div>
                              {activities.length > 0 && (
                                <Link to="/history" className="block py-3 border-b border-edge hover:border-chalk transition-colors group">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="label-caps">Last 7 Days</span>
                                    <ArrowRight className="w-3 h-3 text-muted group-hover:text-chalk group-hover:translate-x-0.5 transition-all" />
                                  </div>
                                  <div className="text-2xl font-bold text-chalk tracking-[-0.02em] tabular">{activities.length} <span className="text-dim text-base font-normal">workouts</span></div>
                                </Link>
                              )}
                            </div>
                          )}
                        </div>

                        {(stravaToken || isDemoMode) && userGoals && (
                          <button
                            onClick={handleGeneratePlan}
                            disabled={loading}
                            className="w-full bg-accent hover:bg-accent-hover text-black font-semibold text-[0.8125rem] uppercase tracking-[0.12em] py-4 px-6 flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50"
                          >
                            <Send className={`w-4 h-4 ${loading ? 'animate-pulse' : ''}`} />
                            {loading ? 'Analyzing...' : 'Generate Plan'}
                          </button>
                        )}
                      </div>

                      {/* Right Column: Weekly Plan */}
                      <div className="lg:col-span-2">
                        <div className="border border-edge bg-surface p-5 sm:p-8 min-h-[500px] relative overflow-hidden flex flex-col">
                          <div className="flex items-center justify-between mb-8">
                            <div>
                              <span className="label-caps block mb-2">Your Program</span>
                              <h2 className="text-2xl font-bold text-chalk tracking-[-0.02em]">Weekly Plan</h2>
                            </div>
                            {suggestions && !loading && (
                              <div className="flex gap-2">
                                <button
                                  onClick={handleGeneratePlan}
                                  disabled={loading}
                                  className="inline-flex items-center gap-2 px-3 py-1.5 border border-edge text-dim hover:text-chalk hover:border-chalk text-[0.6875rem] font-semibold uppercase tracking-[0.1em] transition-colors disabled:opacity-50"
                                >
                                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                                  Regenerate
                                </button>
                                <button
                                  onClick={handleCopyPlan}
                                  className={`inline-flex items-center gap-2 px-3 py-1.5 border text-[0.6875rem] font-semibold uppercase tracking-[0.1em] transition-colors ${copySuccess
                                    ? 'border-green-500/50 text-green-400'
                                    : 'border-edge text-dim hover:text-chalk hover:border-chalk'
                                    }`}
                                >
                                  {copySuccess ? <CheckCircle2 className="w-3 h-3" /> : null}
                                  {copySuccess ? 'Copied' : 'Copy'}
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="flex-1">
                            <AnimatePresence mode="wait">
                              {!suggestions ? (
                                <motion.div
                                  key="empty"
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -20 }}
                                  className="h-[400px] flex flex-col items-center justify-center text-center px-10"
                                >
                                  <h3 className="text-3xl font-bold text-chalk tracking-[-0.02em] mb-4">Ready when you are</h3>
                                  <p className="text-dim max-w-[44ch] leading-[1.7]">
                                    Set your goals, connect Strava, and generate a plan tailored to your week.
                                  </p>
                                </motion.div>
                              ) : parsedPlan ? (
                                <motion.div
                                  key="plan"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                >
                                  <WorkoutPlan key={suggestions?.length} plan={parsedPlan} onEditDay={handleEditDay} />
                                </motion.div>
                              ) : (
                                <div className="prose prose-invert max-w-none">
                                  <ReactMarkdown>{suggestions}</ReactMarkdown>
                                </div>
                              )}
                            </AnimatePresence>
                          </div>

                          {loading && (
                            <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-50">
                              <div className="w-12 h-12 border-2 border-accent border-t-transparent rounded-full animate-spin mb-8" />
                              <p className="text-xl font-bold text-chalk tracking-[-0.02em]">Building your plan</p>
                              <p className="label-caps mt-3">Analyzing Strava data</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              } />
            </Routes>
          </div>
        </main>

        {/* Coach sidebar panel */}
        {isConfigured && (
          <AskCoach
            messages={chatMessages}
            onSendMessage={handleSendMessage}
            isLoading={chatLoading}
            isOpen={isCoachOpen}
            onClose={() => setIsCoachOpen(false)}
          />
        )}
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}

function App() {
  return (
    <Router>
      <SettingsProvider>
        <Dashboard />
      </SettingsProvider>
    </Router>
  );
}

export default App;
