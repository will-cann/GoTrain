import React, { useState } from 'react';
import { Save } from 'lucide-react';
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
            className="border border-edge bg-surface p-6"
        >
            <div className="mb-8">
                <span className="label-caps block mb-2">Training</span>
                <h2 className="text-lg font-bold text-chalk tracking-[-0.02em]">Your Goals</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="label-caps block">
                        Main Goal
                    </label>
                    <input
                        type="text"
                        required
                        placeholder="e.g. Run a sub-2 hour half marathon"
                        value={goals.mainGoal}
                        onChange={e => setGoals({ ...goals, mainGoal: e.target.value })}
                        className="w-full px-4 py-3 bg-surface border border-edge text-chalk text-[0.9375rem] placeholder:text-muted focus:border-accent focus:outline-none transition-colors"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="label-caps block">
                            Days / Week
                        </label>
                        <select
                            value={goals.daysPerWeek}
                            onChange={e => setGoals({ ...goals, daysPerWeek: Number(e.target.value) })}
                            className="w-full px-4 py-3 bg-surface border border-edge text-chalk text-[0.9375rem] focus:border-accent focus:outline-none transition-colors appearance-none cursor-pointer select-arrow"
                        >
                            {[1, 2, 3, 4, 5, 6, 7].map(num => (
                                <option key={num} value={num}>{num} days</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="label-caps block">
                            Level
                        </label>
                        <select
                            value={goals.fitnessLevel}
                            onChange={e => setGoals({ ...goals, fitnessLevel: e.target.value as any })}
                            className="w-full px-4 py-3 bg-surface border border-edge text-chalk text-[0.9375rem] focus:border-accent focus:outline-none transition-colors appearance-none cursor-pointer select-arrow"
                        >
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="label-caps block">
                        Activities
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {activityOptions.map((option) => (
                            <button
                                key={option.id}
                                type="button"
                                onClick={() => toggleActivity(option.id)}
                                className={`px-3 py-1.5 border text-[0.6875rem] font-semibold uppercase tracking-[0.1em] transition-all ${goals.preferredActivities.includes(option.id)
                                    ? 'bg-accent border-accent text-black'
                                    : 'bg-transparent border-edge text-muted hover:text-chalk hover:border-chalk'
                                    }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="label-caps block">
                        Injuries / Considerations
                    </label>
                    <textarea
                        placeholder="e.g. recovering from ankle pain, prefer low impact"
                        value={goals.considerations || ''}
                        onChange={e => setGoals({ ...goals, considerations: e.target.value })}
                        className="w-full px-4 py-3 bg-surface border border-edge text-chalk text-[0.9375rem] placeholder:text-muted focus:border-accent focus:outline-none transition-colors min-h-[80px] resize-none"
                    />
                </div>

                <motion.button
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="w-full bg-chalk text-black font-semibold text-[0.8125rem] uppercase tracking-[0.12em] py-3 px-4 flex items-center justify-center gap-2 hover:bg-white transition-colors"
                >
                    <Save className="w-4 h-4" />
                    Save Goals
                </motion.button>
            </form>
        </motion.div>
    );
}
