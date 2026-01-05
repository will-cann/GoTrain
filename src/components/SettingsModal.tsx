import React, { useState } from 'react';
import { X, Save, Key } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const { stravaClientId, stravaClientSecret, openAiApiKey, distanceUnit, weightUnit, updateSettings } = useSettings();
    const [formData, setFormData] = useState({
        stravaClientId,
        stravaClientSecret,
        openAiApiKey,
        distanceUnit,
        weightUnit
    });

    // Update local state when context changes (e.g. on initial load)
    React.useEffect(() => {
        setFormData({
            stravaClientId,
            stravaClientSecret,
            openAiApiKey,
            distanceUnit,
            weightUnit
        });
    }, [stravaClientId, stravaClientSecret, openAiApiKey, distanceUnit, weightUnit]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateSettings(formData);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="bg-blue-600 p-6 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white">
                        <Key className="w-6 h-6" />
                        <h2 className="text-xl font-semibold">API Configuration</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-blue-100 hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Strava Client ID
                        </label>
                        <input
                            type="text"
                            value={formData.stravaClientId}
                            onChange={e => setFormData(prev => ({ ...prev, stravaClientId: e.target.value }))}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="Enter Strava Client ID"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Strava Client Secret
                        </label>
                        <input
                            type="password"
                            value={formData.stravaClientSecret}
                            onChange={e => setFormData(prev => ({ ...prev, stravaClientSecret: e.target.value }))}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="Enter Strava Client Secret"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            OpenAI API Key
                        </label>
                        <input
                            type="password"
                            value={formData.openAiApiKey}
                            onChange={e => setFormData(prev => ({ ...prev, openAiApiKey: e.target.value }))}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="sk-..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Distance Units
                            </label>
                            <select
                                value={formData.distanceUnit}
                                onChange={e => setFormData(prev => ({ ...prev, distanceUnit: e.target.value as any }))}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                            >
                                <option value="kilometers">Kilometers (Metric)</option>
                                <option value="miles">Miles (Imperial)</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Weight Units
                            </label>
                            <select
                                value={formData.weightUnit}
                                onChange={e => setFormData(prev => ({ ...prev, weightUnit: e.target.value as any }))}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                            >
                                <option value="kg">Kilograms (kg)</option>
                                <option value="lbs">Pounds (lbs)</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                        >
                            <Save className="w-4 h-4" />
                            Save Configuration
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
