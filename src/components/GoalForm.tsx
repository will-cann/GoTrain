import React, { useState } from 'react';
import { Target, Save, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';

export interface UserGoals {
    mainGoal: string;
    daysPerWeek: number;
    fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
    preferredActivities: string[];
    considerations?: string;
}

interface GoalFormProps {
    onSave: (goals: UserGoals) => void;
    savedGoals?: UserGoals;
}

export function GoalForm({ onSave, savedGoals }: GoalFormProps) {
    const [goals, setGoals] = useState<UserGoals>(savedGoals || {
        mainGoal: '',
        daysPerWeek: 3,
        fitnessLevel: 'intermediate',
        preferredActivities: ['running'],
        considerations: ''
    });

    const toggleActivity = (activity: string) => {
        setGoals(prev => {
            const current = prev.preferredActivities || [];
            const updated = current.includes(activity)
                ? current.filter(a => a !== activity)
                : [...current, activity];
            return { ...prev, preferredActivities: updated.length > 0 ? updated : [activity] };
        });
    };

    const activityOptions = [
        { id: 'running', label: 'Running' },
        { id: 'cycling', label: 'Cycling' },
        { id: 'weightlifting', label: 'Strength' },
        { id: 'yoga', label: 'Yoga' },
        { id: 'swimming', label: 'Swimming' },
        { id: 'mixed', label: 'Mixed' },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(goals);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-8"
        >
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                    <Target className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">Your Fitness Goals</h2>
                    <p className="text-sm text-gray-500 font-medium italic">What are we training for?</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-3">
                    <label className="block text-sm font-bold text-gray-700 ml-1">
                        What is your main goal?
                    </label>
                    <div className="relative group">
                        <Trophy className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            required
                            placeholder="e.g. Run a sub-2 hour half marathon"
                            value={goals.mainGoal}
                            onChange={e => setGoals({ ...goals, mainGoal: e.target.value })}
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border-transparent border-2 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 focus:outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <label className="block text-sm font-bold text-gray-700 ml-1">
                            Days per week
                        </label>
                        <select
                            value={goals.daysPerWeek}
                            onChange={e => setGoals({ ...goals, daysPerWeek: Number(e.target.value) })}
                            className="w-full px-4 py-4 bg-gray-50 border-transparent border-2 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 focus:outline-none transition-all font-bold text-gray-900 appearance-none cursor-pointer"
                        >
                            {[1, 2, 3, 4, 5, 6, 7].map(num => (
                                <option key={num} value={num}>{num} days</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-3">
                        <label className="block text-sm font-bold text-gray-700 ml-1">
                            Fitness Level
                        </label>
                        <select
                            value={goals.fitnessLevel}
                            onChange={e => setGoals({ ...goals, fitnessLevel: e.target.value as any })}
                            className="w-full px-4 py-4 bg-gray-50 border-transparent border-2 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 focus:outline-none transition-all font-bold text-gray-900 appearance-none cursor-pointer"
                        >
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="block text-sm font-bold text-gray-700 ml-1">
                        Preferred Activity Types
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {activityOptions.map((option) => (
                            <button
                                key={option.id}
                                type="button"
                                onClick={() => toggleActivity(option.id)}
                                className={`px-4 py-2 rounded-xl border-2 transition-all text-sm font-bold uppercase tracking-wider ${goals.preferredActivities.includes(option.id)
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200'
                                    : 'bg-gray-50 border-transparent text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="block text-sm font-bold text-gray-700 ml-1">
                        Any injuries or considerations?
                    </label>
                    <textarea
                        placeholder="e.g. recovering from ankle pain, prefer low impact"
                        value={goals.considerations || ''}
                        onChange={e => setGoals({ ...goals, considerations: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border-transparent border-2 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 focus:outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400 min-h-[100px] resize-none"
                    />
                </div>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="w-full bg-gray-900 text-white font-black py-4 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-gray-200 hover:bg-black transition-all"
                >
                    <Save className="w-5 h-5" />
                    Save Goals
                </motion.button>
            </form>
        </motion.div>
    );
}
