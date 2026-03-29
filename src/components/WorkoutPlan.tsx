import React, { useState } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Map, Dumbbell, Coffee, MessageSquarePlus, ChevronDown, Zap } from 'lucide-react';

export interface WorkoutExercise {
    name: string;
    sets: string;
    reps: string;
    weight: string;
    notes: string;
}

export interface WorkoutActivity {
    name: string;
    duration: string;
    intensity: string;
    details: string;
    exercises?: WorkoutExercise[];
}

export interface WorkoutDay {
    dayNumber: number;
    date: string;
    title: string;
    type: 'rest' | 'run' | 'strength' | 'cross-train';
    activities: WorkoutActivity[];
    coachTips: string[];
}

export interface WeeklyPlan {
    weeklySummary: string;
    days: WorkoutDay[];
}

interface WorkoutPlanProps {
    plan: WeeklyPlan;
    onEditDay?: (dayNumber: number, activityType: string) => void;
}

const TypeIcon = ({ type }: { type: WorkoutDay['type'] }) => {
    switch (type) {
        case 'run': return <Map className="w-4 h-4" />;
        case 'strength': return <Dumbbell className="w-4 h-4" />;
        case 'rest': return <Coffee className="w-4 h-4" />;
        default: return <Zap className="w-4 h-4" />;
    }
};

const IntensityBadge = ({ intensity }: { intensity: string }) => {
    const colors: Record<string, string> = {
        'Easy': 'text-green-400 border-green-400/30',
        'Moderate': 'text-accent border-accent/30',
        'Hard': 'text-orange-400 border-orange-400/30',
        'Max': 'text-red-400 border-red-400/30',
    };
    const colorClass = colors[intensity] || 'text-dim border-edge';
    return (
        <span className={`px-2 py-0.5 border text-[0.625rem] font-semibold uppercase tracking-[0.1em] ${colorClass}`}>
            {intensity}
        </span>
    );
};

export const WorkoutPlan: React.FC<WorkoutPlanProps> = ({ plan, onEditDay }) => {
    const [expandedDayId, setExpandedDayId] = useState<number | null>(null);

    const toggleDay = (dayNumber: number) => {
        setExpandedDayId(expandedDayId === dayNumber ? null : dayNumber);
    };

    return (
        <div className="space-y-6 pb-12">
            {/* Weekly Summary */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-l-2 border-accent pl-5 py-2"
            >
                <span className="label-caps block mb-2">Weekly Focus</span>
                <p className="text-dim leading-[1.7] text-[0.9375rem] max-w-[60ch]">
                    {plan.weeklySummary}
                </p>
            </motion.div>

            {/* Days */}
            <div className="flex flex-col">
                {plan.days.map((day, index) => {
                    const isExpanded = expandedDayId === day.dayNumber;
                    const isRest = day.type === 'rest';

                    return (
                        <motion.div
                            layout
                            key={day.dayNumber}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.04 }}
                            className={`border-b border-edge ${isExpanded ? 'bg-surface' : ''}`}
                        >
                            {/* Header */}
                            <motion.div
                                layout="position"
                                onClick={() => toggleDay(day.dayNumber)}
                                className="py-4 px-2 cursor-pointer flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`${isRest ? 'text-muted' : 'text-chalk'}`}>
                                        <TypeIcon type={day.type} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-0.5">
                                            <span className="label-caps">
                                                {day.date ? format(new Date(day.date), 'EEE, MMM d') : `Day ${day.dayNumber}`}
                                            </span>
                                            {!isExpanded && day.activities.length > 0 && (
                                                <span className="text-[0.625rem] text-muted">{day.activities[0].duration}</span>
                                            )}
                                        </div>
                                        <h3 className={`text-[0.9375rem] font-semibold leading-tight ${isRest ? 'text-muted' : 'text-chalk'}`}>
                                            {day.title}
                                        </h3>
                                    </div>
                                </div>
                                <ChevronDown className={`w-4 h-4 text-muted transition-transform duration-200 ${isExpanded ? 'rotate-180 text-chalk' : ''}`} />
                            </motion.div>

                            {/* Expanded */}
                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                    >
                                        <div className="px-2 pb-5 pt-0 border-t border-edge">
                                            {day.activities.length > 0 ? (
                                                <div className="space-y-6 mt-5">
                                                    {day.activities.map((activity, actIndex) => (
                                                        <div key={actIndex}>
                                                            <div className="flex items-center justify-between mb-3">
                                                                <h4 className="font-semibold text-chalk flex items-center gap-3 text-[0.9375rem]">
                                                                    {activity.name}
                                                                    <IntensityBadge intensity={activity.intensity} />
                                                                </h4>
                                                                <div className="flex items-center gap-1.5 text-muted text-xs">
                                                                    <Clock className="w-3 h-3" />
                                                                    {activity.duration}
                                                                </div>
                                                            </div>

                                                            <p className="text-[0.875rem] text-dim mb-4 border-l border-edge pl-4 leading-[1.7] max-w-[55ch]">
                                                                {activity.details}
                                                            </p>

                                                            {activity.exercises && activity.exercises.length > 0 && (
                                                                <div className="overflow-hidden border border-edge mb-4">
                                                                    <table className="w-full text-sm text-left">
                                                                        <thead className="border-b border-edge">
                                                                            <tr>
                                                                                <th className="px-4 py-2 label-caps">Exercise</th>
                                                                                <th className="px-4 py-2 label-caps text-center">Sets</th>
                                                                                <th className="px-4 py-2 label-caps text-center">Reps</th>
                                                                                <th className="px-4 py-2 label-caps text-right">Weight</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-edge">
                                                                            {activity.exercises.map((ex, exIndex) => (
                                                                                <tr key={exIndex} className="hover:bg-surface-raised transition-colors">
                                                                                    <td className="px-4 py-2.5 font-semibold text-chalk text-[0.875rem]">
                                                                                        {ex.name}
                                                                                        {ex.notes && <div className="text-[0.625rem] text-muted mt-0.5 font-normal">{ex.notes}</div>}
                                                                                    </td>
                                                                                    <td className="px-4 py-2.5 text-center text-dim tabular">{ex.sets}</td>
                                                                                    <td className="px-4 py-2.5 text-center text-dim tabular">{ex.reps}</td>
                                                                                    <td className="px-4 py-2.5 text-right text-dim tabular">{ex.weight}</td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="py-6 text-center text-muted text-sm">Rest day. Recover well.</div>
                                            )}

                                            {day.coachTips.length > 0 && (
                                                <div className="mt-5 border-l-2 border-accent/40 pl-4 py-2">
                                                    <span className="label-caps text-accent/70 block mb-2">Coach Notes</span>
                                                    <ul className="space-y-1.5">
                                                        {day.coachTips.map((tip, idx) => (
                                                            <li key={idx} className="text-[0.875rem] text-dim leading-[1.65] max-w-[55ch]">
                                                                {tip}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            <div className="mt-5 pt-4 border-t border-edge flex justify-end">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onEditDay?.(day.dayNumber, day.type);
                                                    }}
                                                    className="text-[0.6875rem] font-semibold text-accent hover:text-accent-hover uppercase tracking-[0.1em] flex items-center gap-1.5 transition-colors"
                                                >
                                                    <MessageSquarePlus className="w-3.5 h-3.5" />
                                                    Edit with Coach
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};
