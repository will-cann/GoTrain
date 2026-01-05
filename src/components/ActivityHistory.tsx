import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Map, Trophy, Timer, Activity, Heart, RefreshCw } from 'lucide-react';
import type { StravaActivity } from '../services/strava';
import { format } from 'date-fns';

interface ActivityHistoryProps {
    activities: StravaActivity[];
    distanceUnit: 'kilometers' | 'miles';
    onRefresh: () => void;
    isRefreshing: boolean;
}

export const ActivityHistory: React.FC<ActivityHistoryProps> = ({
    activities,
    distanceUnit,
    onRefresh,
    isRefreshing
}) => {
    const formatDistance = (meters: number) => {
        if (distanceUnit === 'miles') {
            return (meters * 0.000621371).toFixed(2) + ' mi';
        }
        return (meters / 1000).toFixed(2) + ' km';
    };

    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    if (activities.length === 0) {
        return (
            <div className="bg-white rounded-3xl p-12 border border-gray-100 shadow-xl shadow-blue-50/50 text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Activity className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No activities yet</h3>
                <p className="text-gray-500 max-w-xs mx-auto">
                    Connect your Strava account to see your workout history here.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Recent Activity</h2>
                    <p className="text-gray-500 font-medium">Your last 7 days of training</p>
                </div>
                <div className="bg-blue-50 px-4 py-2 rounded-2xl border border-blue-100 flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-blue-600" />
                        <span className="text-blue-700 font-bold text-sm">{activities.length} Workouts</span>
                    </div>
                    <div className="w-px h-4 bg-blue-200" />
                    <button
                        onClick={onRefresh}
                        disabled={isRefreshing}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-bold text-sm transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        {isRefreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activities.map((activity, index) => (
                    <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all group"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <Activity className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                        {activity.name}
                                    </h4>
                                    <div className="flex items-center gap-2 text-gray-400 text-xs font-medium">
                                        <Calendar className="w-3 h-3" />
                                        {format(new Date(activity.start_date), 'MMM d, yyyy • h:mm a')}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 border-t border-gray-50 pt-4 mt-2">
                            <div className="space-y-1">
                                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Distance</p>
                                <div className="flex items-center gap-1.5 font-bold text-gray-700">
                                    <Map className="w-3.5 h-3.5 text-blue-500" />
                                    <span>{formatDistance(activity.distance)}</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Time</p>
                                <div className="flex items-center gap-1.5 font-bold text-gray-700">
                                    <Timer className="w-3.5 h-3.5 text-amber-500" />
                                    <span>{formatDuration(activity.moving_time)}</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Type</p>
                                <div className="flex items-center gap-1.5 font-bold text-gray-700 capitalize">
                                    <Heart className="w-3.5 h-3.5 text-rose-500" />
                                    <span>{activity.type.toLowerCase()}</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
