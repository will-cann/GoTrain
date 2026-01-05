import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Clock, Zap, Map, Info, Dumbbell, Coffee } from 'lucide-react';

export interface WorkoutActivity {
    name: string;
    duration: string;
    intensity: string;
    details: string;
}

export interface WorkoutDay {
    dayNumber: number;
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

export const WorkoutPlan: React.FC<WorkoutPlanProps> = ({ plan }) => {
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

            {/* Days Grid */}
            <div className="grid grid-cols-1 gap-6">
                {plan.days.map((day, index) => (
                    <motion.div
                        key={day.dayNumber}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`relative group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-all ${day.type === 'rest' ? 'bg-gray-50/50' : 'shadow-sm'
                            }`}
                    >
                        <div className={`absolute top-0 left-0 w-1.5 h-full ${day.type === 'rest' ? 'bg-gray-200' :
                                day.type === 'run' ? 'bg-blue-500' :
                                    day.type === 'strength' ? 'bg-purple-500' : 'bg-orange-500'
                            }`} />

                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl ${day.type === 'rest' ? 'bg-gray-100' :
                                            day.type === 'run' ? 'bg-blue-50' :
                                                day.type === 'strength' ? 'bg-purple-50' : 'bg-orange-50'
                                        }`}>
                                        <TypeIcon type={day.type} />
                                    </div>
                                    <div>
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Day {day.dayNumber}</span>
                                        <h3 className="text-lg font-bold text-gray-900 leading-tight">{day.title}</h3>
                                    </div>
                                </div>
                            </div>

                            {day.activities.length > 0 ? (
                                <div className="space-y-4">
                                    {day.activities.map((activity, actIndex) => (
                                        <div key={actIndex} className="bg-gray-50 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-bold text-gray-800">{activity.name}</h4>
                                                    <IntensityBadge intensity={activity.intensity} />
                                                </div>
                                                <p className="text-xs text-gray-500">{activity.details}</p>
                                            </div>
                                            <div className="flex items-center gap-4 text-gray-700">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="w-4 h-4 text-gray-400" />
                                                    <span className="text-sm font-semibold">{activity.duration}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-2 italic text-gray-400 text-sm">No scheduled activities for this day.</div>
                            )}

                            {day.coachTips.length > 0 && (
                                <div className="mt-6 flex gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
                                    <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                    <div className="space-y-1.5">
                                        {day.coachTips.map((tip, tipIndex) => (
                                            <p key={tipIndex} className="text-sm text-amber-800 leading-relaxed font-medium">
                                                {tip}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
