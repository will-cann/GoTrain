import React, { useState, useEffect, useCallback } from 'react';
import { X, Save } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const { stravaClientId, stravaClientSecret, openAiApiKey, hevyApiKey, distanceUnit, weightUnit, updateSettings } = useSettings();
    const [formData, setFormData] = useState({
        stravaClientId,
        stravaClientSecret,
        openAiApiKey,
        hevyApiKey,
        distanceUnit,
        weightUnit
    });

    useEffect(() => {
        setFormData({
            stravaClientId,
            stravaClientSecret,
            openAiApiKey,
            hevyApiKey,
            distanceUnit,
            weightUnit
        });
    }, [stravaClientId, stravaClientSecret, openAiApiKey, hevyApiKey, distanceUnit, weightUnit]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
    }, [onClose]);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, handleKeyDown]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateSettings(formData);
        onClose();
    };

    return (
        <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-black border border-edge w-full max-w-md overflow-hidden" role="dialog" aria-label="Settings">
                <div className="px-6 py-4 flex items-center justify-between border-b border-edge">
                    <h2 className="label-caps text-chalk">Configuration</h2>
                    <button
                        onClick={onClose}
                        className="text-muted hover:text-chalk transition-colors p-1"
                        aria-label="Close settings"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="label-caps block">Strava Client ID</label>
                        <input
                            type="text"
                            value={formData.stravaClientId}
                            onChange={e => setFormData(prev => ({ ...prev, stravaClientId: e.target.value }))}
                            className="w-full px-4 py-2.5 bg-surface border border-edge text-chalk text-[0.9375rem] placeholder:text-muted focus:border-accent focus:outline-none transition-colors"
                            placeholder="Enter Client ID"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="label-caps block">Strava Client Secret</label>
                        <input
                            type="password"
                            value={formData.stravaClientSecret}
                            onChange={e => setFormData(prev => ({ ...prev, stravaClientSecret: e.target.value }))}
                            className="w-full px-4 py-2.5 bg-surface border border-edge text-chalk text-[0.9375rem] placeholder:text-muted focus:border-accent focus:outline-none transition-colors"
                            placeholder="Enter Client Secret"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="label-caps block">OpenAI API Key</label>
                        <input
                            type="password"
                            value={formData.openAiApiKey}
                            onChange={e => setFormData(prev => ({ ...prev, openAiApiKey: e.target.value }))}
                            className="w-full px-4 py-2.5 bg-surface border border-edge text-chalk text-[0.9375rem] placeholder:text-muted focus:border-accent focus:outline-none transition-colors"
                            placeholder="sk-..."
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="label-caps block">Hevy API Key <span className="text-muted">(Optional)</span></label>
                        <input
                            type="password"
                            value={formData.hevyApiKey}
                            onChange={e => setFormData(prev => ({ ...prev, hevyApiKey: e.target.value }))}
                            className="w-full px-4 py-2.5 bg-surface border border-edge text-chalk text-[0.9375rem] placeholder:text-muted focus:border-accent focus:outline-none transition-colors"
                            placeholder="Enter Hevy API Key"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="space-y-2">
                            <label className="label-caps block">Distance</label>
                            <select
                                value={formData.distanceUnit}
                                onChange={e => setFormData(prev => ({ ...prev, distanceUnit: e.target.value as any }))}
                                className="w-full px-4 py-2.5 bg-surface border border-edge text-chalk text-[0.9375rem] focus:border-accent focus:outline-none transition-colors appearance-none cursor-pointer select-arrow"
                            >
                                <option value="kilometers">Kilometers</option>
                                <option value="miles">Miles</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="label-caps block">Weight</label>
                            <select
                                value={formData.weightUnit}
                                onChange={e => setFormData(prev => ({ ...prev, weightUnit: e.target.value as any }))}
                                className="w-full px-4 py-2.5 bg-surface border border-edge text-chalk text-[0.9375rem] focus:border-accent focus:outline-none transition-colors appearance-none cursor-pointer select-arrow"
                            >
                                <option value="kg">Kilograms</option>
                                <option value="lbs">Pounds</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            className="w-full bg-accent hover:bg-accent-hover text-black font-semibold text-[0.8125rem] uppercase tracking-[0.12em] py-3 px-4 flex items-center justify-center gap-2 transition-colors"
                        >
                            <Save className="w-4 h-4" />
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
