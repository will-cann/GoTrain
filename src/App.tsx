import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { BrowserRouter as Router, Routes, Route, NavLink, Link } from 'react-router-dom';
import {
  Settings as SettingsIcon,
  RefreshCw,
  CheckCircle2,
  Zap,
  Send,
  History,
  LayoutDashboard,
  AlertCircle
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
import { motion, AnimatePresence } from 'framer-motion';

function Dashboard() {
  const { isConfigured, stravaClientId, stravaClientSecret, openAiApiKey, distanceUnit, weightUnit } = useSettings();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [userGoals, setUserGoals] = useState<UserGoals | undefined>(() => {
    const saved = localStorage.getItem('workoutBinderUserGoals');
    if (!saved) return undefined;
    const parsed = JSON.parse(saved);
    // Migration: preferredActivity (string) -> preferredActivities (array)
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

  useEffect(() => {
    localStorage.setItem('workoutBinderChatMessages', JSON.stringify(chatMessages));
  }, [chatMessages]);

  useEffect(() => {
    // Handle Strava OAuth Redirect
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code && isConfigured) {
      const handleOAuth = async () => {
        setLoading(true);
        try {
          const data = await exchangeToken(stravaClientId, stravaClientSecret, code);
          saveStravaTokens(data);
          // Clear query params
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

    // Token expired, refresh it
    try {
      const data = await refreshToken(stravaClientId, stravaClientSecret, refresh);
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

  const handleConnectStrava = () => {
    if (!isConfigured) {
      setIsSettingsOpen(true);
      return;
    }
    const redirectUri = window.location.origin;
    window.location.href = getStravaAuthUrl(stravaClientId, redirectUri);
  };

  const handleGeneratePlan = async () => {
    if (!userGoals || !openAiApiKey) return;

    setLoading(true);
    setError(null);
    try {
      const token = await getValidToken();
      if (!token) {
        setError('Please connect to Strava first.');
        setLoading(false);
        return;
      }

      const recentActivities = await getRecentActivities(token);
      setActivities(recentActivities);
      localStorage.setItem('workoutBinderActivities', JSON.stringify(recentActivities));

      const units = { distance: distanceUnit, weight: weightUnit };
      const workoutPlan = await generateWorkoutSuggestions(openAiApiKey, userGoals, recentActivities, units);
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
      const token = await getValidToken();
      if (!token) {
        setError('Please connect to Strava first.');
        return;
      }
      const latestActivities = await getRecentActivities(token);
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
    if (!openAiApiKey) return;

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
        { distance: distanceUnit, weight: weightUnit }
      );

      let finalContent = coachResponse;

      // Look for revised plan
      const planMatch = coachResponse.match(/<REVISED_PLAN>([\s\S]*?)<\/REVISED_PLAN>/);
      if (planMatch) {
        try {
          let newPlanJson = planMatch[1].trim();
          // Strip markdown code blocks if present
          if (newPlanJson.startsWith('```')) {
            newPlanJson = newPlanJson.replace(/^```[a-z]*\n/i, '').replace(/\n```$/i, '').trim();
          }
          const newParsedPlan = JSON.parse(newPlanJson);
          setParsedPlan(newParsedPlan);
          setSuggestions(newPlanJson);
          localStorage.setItem('workoutBinderSuggestions', newPlanJson);

          // Clean up the response for display
          finalContent = coachResponse.replace(/<REVISED_PLAN>[\s\S]*?<\/REVISED_PLAN>/, 'I\'ve updated your plan based on your request! ✨');
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

  return (
    <div className="min-h-screen bg-transparent flex flex-col">
      <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <Link to="/" className="text-3xl font-black text-blue-600 tracking-tighter hover:scale-105 transition-transform">
              GoTrain
            </Link>

            {isConfigured && (
              <div className="hidden md:flex items-center gap-1">
                <NavLink
                  to="/"
                  className={({ isActive }) => `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-gray-500 hover:bg-blue-50 hover:text-blue-600'
                    }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Weekly Plan
                </NavLink>
                <NavLink
                  to="/history"
                  className={({ isActive }) => `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-gray-500 hover:bg-blue-50 hover:text-blue-600'
                    }`}
                >
                  <History className="w-4 h-4" />
                  Activity History
                </NavLink>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-3 text-gray-400 hover:text-blue-600 transition-all rounded-2xl hover:bg-blue-50 border border-transparent hover:border-blue-100"
              title="Settings"
            >
              <SettingsIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
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
            <div className="space-y-8">
              {/* Existing Dashboard Content */}
              {!isConfigured ? (
                <div className="text-center py-20">
                  <div className="bg-white p-10 rounded-3xl shadow-xl shadow-blue-50 max-w-md mx-auto border border-blue-50">
                    <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mb-8 mx-auto rotate-3 shadow-lg shadow-blue-200">
                      <Zap className="w-10 h-10 text-white fill-white" />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Welcome to GoTrain ⚡️</h2>
                    <p className="text-gray-600 mb-10 leading-relaxed font-medium">
                      Ready to level up? Configure your API keys to unlock personalized, AI-driven training plans that evolve with you.
                    </p>
                    <button
                      onClick={() => setIsSettingsOpen(true)}
                      className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 hover:-translate-y-0.5"
                    >
                      <SettingsIcon className="w-5 h-5 inline mr-2" />
                      Configure APIs
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column: Goals & Inputs */}
                  <div className="lg:col-span-1 space-y-6">
                    <GoalForm onSave={handleSaveGoals} savedGoals={userGoals} />

                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                      <h2 className="text-xl font-black text-gray-900 mb-6">Data Sources</h2>
                      {!stravaToken ? (
                        <button
                          onClick={handleConnectStrava}
                          disabled={loading}
                          className="w-full bg-[#FC6100] hover:bg-[#e65a00] text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-orange-100 disabled:opacity-50"
                        >
                          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                          Connect to Strava
                        </button>
                      ) : (
                        <div className="space-y-6">
                          <div className="flex items-center justify-between p-4 bg-green-50 rounded-2xl border border-green-100">
                            <div className="flex items-center gap-3 text-green-700">
                              <CheckCircle2 className="w-5 h-5" />
                              <span className="font-bold">Strava Connected</span>
                            </div>
                            <button
                              onClick={handleDisconnectStrava}
                              className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors"
                            >
                              Disconnect
                            </button>
                          </div>
                          {activities.length > 0 && (
                            <Link to="/history" className="block p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-blue-200 transition-all group">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-bold text-gray-600">Last 7 Days</span>
                                <History className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                              </div>
                              <div className="text-2xl font-black text-gray-900">{activities.length} Workouts</div>
                            </Link>
                          )}
                        </div>
                      )}
                    </div>

                    {stravaToken && userGoals && (
                      <button
                        onClick={handleGeneratePlan}
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 px-6 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-blue-200 transition-all active:scale-[0.98] disabled:opacity-50 hover:-translate-y-0.5"
                      >
                        <Send className={`w-6 h-6 ${loading ? 'animate-pulse' : ''}`} />
                        {loading ? 'Analyzing...' : 'Generate AI Weekly Plan'}
                      </button>
                    )}
                  </div>

                  {/* Right Column: Weekly Plan */}
                  <div className="lg:col-span-2">
                    {/* The existing Weekly Plan View logic */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 min-h-[600px] relative overflow-hidden flex flex-col">
                      <div className="flex items-center justify-between mb-10">
                        <div>
                          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Your Weekly Plan</h2>
                          <p className="text-sm text-gray-500 mt-2 font-medium italic">Custom tailored training session just for you</p>
                        </div>
                        {suggestions && !loading && (
                          <div className="flex gap-3">
                            <button
                              onClick={handleGeneratePlan}
                              disabled={loading}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                            >
                              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                              {loading ? 'Generating...' : 'Regenerate'}
                            </button>
                            <button
                              onClick={handleCopyPlan}
                              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${copySuccess
                                ? 'bg-green-100 text-green-700 scale-105'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                              {copySuccess ? <CheckCircle2 className="w-4 h-4" /> : <span>📋</span>}
                              {copySuccess ? 'Copied!' : 'Copy'}
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
                              className="h-[500px] flex flex-col items-center justify-center text-center px-10"
                            >
                              <div className="w-24 h-24 bg-blue-50 rounded-3xl flex items-center justify-center mb-8 relative rotate-6">
                                <div className="absolute inset-0 bg-blue-100/50 rounded-3xl animate-ping" />
                                <RefreshCw className="w-12 h-12 text-blue-400 relative z-10" />
                              </div>
                              <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">Ready to start?</h3>
                              <p className="text-gray-500 max-w-sm leading-relaxed font-medium">
                                We'll analyze your recent performance and future goals to generate a perfect training schedule.
                              </p>
                            </motion.div>
                          ) : parsedPlan ? (
                            <motion.div
                              key="plan"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                            >
                              <WorkoutPlan key={suggestions?.length} plan={parsedPlan} />
                            </motion.div>
                          ) : (
                            <div className="prose max-w-none">
                              <ReactMarkdown>{suggestions}</ReactMarkdown>
                            </div>
                          )}
                        </AnimatePresence>
                      </div>

                      {loading && (
                        <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center z-50">
                          <div className="relative">
                            <div className="w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center text-blue-600">
                              <Zap className="w-8 h-8 animate-pulse" />
                            </div>
                          </div>
                          <p className="mt-8 text-2xl font-black text-gray-900 tracking-tight">Crafting Excellence...</p>
                          <p className="text-gray-500 font-bold mt-2 uppercase tracking-widest text-[10px]">Processing Strava Data</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          } />
        </Routes>
      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {isConfigured && (
        <AskCoach
          messages={chatMessages}
          onSendMessage={handleSendMessage}
          isLoading={chatLoading}
        />
      )}
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
