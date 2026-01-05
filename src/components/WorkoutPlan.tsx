import React, { useState } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Clock, Zap, Map, Info, Dumbbell, Coffee, X, MessageSquarePlus, ChevronDown } from 'lucide-react';

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
        case 'run': return <Map className="w-5 h-5 text-blue-500" />;
        case 'strength': return <Dumbbell className="w-5 h-5 text-purple-500" />;
        case 'rest': return <Coffee className="w-5 h-5 text-gray-400" />;
        default: return <Zap className="w-5 h-5 text-orange-500" />;
    }
};

const IntensityBadge = ({ intensity }: { intensity: string }) => {
    const colors: Record<string, string> = {
        'Easy': 'bg-green-100 text-green-700',
        'Moderate': 'bg-blue-100 text-blue-700',
        'Hard': 'bg-orange-100 text-orange-700',
        'Max': 'bg-red-100 text-red-700',
    };
    const colorClass = colors[intensity] || 'bg-gray-100 text-gray-700';
    return (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${colorClass}`}>
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
        <div className="space-y-8 pb-12">
            {/* Weekly Summary Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl shadow-blue-200"
            >
                <div className="flex items-center gap-3 mb-3">
                    <Trophy className="w-6 h-6 text-yellow-300" />
                    <h2 className="text-xl font-bold">Weekly Training Focus</h2>
                </div>
                <p className="text-blue-50 leading-relaxed text-sm">
                    {plan.weeklySummary}
                </p>
            </motion.div>

            {/* Days Grid - Accordion Style */}
            <div className="flex flex-col gap-4">
                {plan.days.map((day, index) => {
                    const isExpanded = expandedDayId === day.dayNumber;

                    return (
                        <motion.div
                            layout
                            key={day.dayNumber}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`bg-white border rounded-2xl overflow-hidden transition-all ${isExpanded ? 'shadow-xl border-blue-200 ring-4 ring-blue-50 z-10' : 'shadow-sm border-gray-100 hover:shadow-md'
                                } ${day.type === 'rest' ? 'bg-gray-50/50' : ''}`}
                        >
                            {/* Card Header - Always Visible */}
                            <motion.div
                                layout="position"
                                onClick={() => toggleDay(day.dayNumber)}
                                className="p-5 cursor-pointer flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl transition-colors ${day.type === 'rest' ? 'bg-gray-100' :
                                        day.type === 'run' ? 'bg-blue-50 group-hover:bg-blue-100' :
                                            day.type === 'strength' ? 'bg-purple-50 group-hover:bg-purple-100' :
                                                'bg-orange-50 group-hover:bg-orange-100'
                                        }`}>
                                        <TypeIcon type={day.type} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                                {day.date ? format(new Date(day.date), 'EEE, MMM d') : `Day ${day.dayNumber}`}
                                            </span>
                                            {!isExpanded && day.activities.length > 0 && (
                                                <span className="text-[10px] font-bold text-gray-400">• {day.activities[0].duration}</span>
                                            )}
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 leading-tight">{day.title}</h3>
                                    </div>
                                </div>
                                <div className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                                    <ChevronDown className={`w-5 h-5 ${isExpanded ? 'text-blue-500' : 'text-gray-300'}`} />
                                </div>
                            </motion.div>

                            {/* Expanded Content */}
                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                    >
                                        <div className="px-5 pb-5 pt-0 border-t border-gray-100 mt-2">
                                            {/* Activities List */}
                                            {day.activities.length > 0 ? (
                                                <div className="space-y-6 mt-6">
                                                    {day.activities.map((activity, actIndex) => (
                                                        <div key={actIndex}>
                                                            <div className="flex items-center justify-between mb-3">
                                                                <h4 className="font-bold text-gray-800 flex items-center gap-2">
                                                                    {activity.name}
                                                                    <IntensityBadge intensity={activity.intensity} />
                                                                </h4>
                                                                <div className="flex items-center gap-1.5 text-gray-500 text-sm font-medium">
                                                                    <Clock className="w-4 h-4" />
                                                                    {activity.duration}
                                                                </div>
                                                            </div>

                                                            <p className="text-sm text-gray-600 mb-4 bg-gray-50 p-3 rounded-xl border border-gray-100 leading-relaxed">
                                                                {activity.details}
                                                            </p>

                                                            {/* Structured Exercises Table */}
                                                            {activity.exercises && activity.exercises.length > 0 && (
                                                                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm mb-4">
                                                                    <table className="w-full text-sm text-left">
                                                                        <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] tracking-wider border-b border-gray-100">
                                                                            <tr>
                                                                                <th className="px-4 py-3">Exercise</th>
                                                                                <th className="px-4 py-3 text-center">Sets</th>
                                                                                <th className="px-4 py-3 text-center">Reps</th>
                                                                                <th className="px-4 py-3 text-right">Weight</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-gray-100">
                                                                            {activity.exercises.map((ex, exIndex) => (
                                                                                <tr key={exIndex} className="hover:bg-blue-50/50 transition-colors">
                                                                                    <td className="px-4 py-3 font-semibold text-gray-800">
                                                                                        {ex.name}
                                                                                        {ex.notes && <div className="text-[10px] text-gray-400 font-normal mt-0.5">{ex.notes}</div>}
                                                                                    </td>
                                                                                    <td className="px-4 py-3 text-center text-gray-600 font-medium">{ex.sets}</td>
                                                                                    <td className="px-4 py-3 text-center text-gray-600 font-medium">{ex.reps}</td>
                                                                                    <td className="px-4 py-3 text-right text-gray-600 font-medium">{ex.weight}</td>
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
                                                <div className="py-8 text-center text-gray-400 italic">Rest day - no scheduled activities. recover well!</div>
                                            )}

                                            {/* Coach Tips */}
                                            {day.coachTips.length > 0 && (
                                                <div className="mt-6 bg-amber-50 rounded-xl p-4 border border-amber-100">
                                                    <h5 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-2">Coach Notes</h5>
                                                    <ul className="space-y-2">
                                                        {day.coachTips.map((tip, idx) => (
                                                            <li key={idx} className="text-sm text-amber-900 flex gap-2">
                                                                <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400" />
                                                                {tip}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {/* Edit Button */}
                                            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onEditDay?.(day.dayNumber, day.type);
                                                    }}
                                                    className="text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1.5"
                                                >
                                                    <MessageSquarePlus className="w-4 h-4" />
                                                    Discuss changes with Coach
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
        </div >
    );
};
