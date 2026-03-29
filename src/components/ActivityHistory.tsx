import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Map, Timer, Heart, RefreshCw } from 'lucide-react';
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
            <div className="border border-edge bg-surface p-12 text-center">
                <h3 className="text-lg font-bold text-chalk tracking-[-0.02em] mb-3">No activities yet</h3>
                <p className="text-muted">
                    Connect Strava to see your workout history.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <span className="label-caps block mb-2">Strava</span>
                    <h2 className="text-2xl font-bold text-chalk tracking-[-0.02em]">Recent Activity</h2>
                </div>
                <div className="flex items-center gap-6">
                    <span className="text-chalk font-semibold text-sm tabular">{activities.length} <span className="text-muted font-normal">workouts</span></span>
                    <button
                        onClick={onRefresh}
                        disabled={isRefreshing}
                        className="flex items-center gap-2 text-muted hover:text-chalk text-[0.6875rem] font-semibold uppercase tracking-[0.1em] transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                        {isRefreshing ? 'Refreshing' : 'Refresh'}
                    </button>
                </div>
            </div>

            <div className="border-t border-edge">
                {activities.map((activity, index) => (
                    <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="border-b border-edge py-5 px-2 group hover:bg-surface transition-colors"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-chalk text-[0.9375rem]">
                                {activity.name}
                            </h4>
                            <div className="flex items-center gap-2 text-muted text-xs">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(activity.start_date), 'MMM d, yyyy')}
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-1.5 text-[0.875rem]">
                                <Map className="w-3 h-3 text-muted" />
                                <span className="text-chalk tabular">{formatDistance(activity.distance)}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[0.875rem]">
                                <Timer className="w-3 h-3 text-muted" />
                                <span className="text-chalk tabular">{formatDuration(activity.moving_time)}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[0.875rem]">
                                <Heart className="w-3 h-3 text-muted" />
                                <span className="text-dim capitalize">{activity.type.toLowerCase()}</span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
