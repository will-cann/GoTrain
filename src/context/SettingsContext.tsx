import React, { createContext, useContext, useState, useEffect } from 'react';

interface Settings {
    stravaClientId: string;
    stravaClientSecret: string;
    openAiApiKey: string;
    hevyApiKey: string;
    distanceUnit: 'kilometers' | 'miles';
    weightUnit: 'kg' | 'lbs';
    isConfigured: boolean;
}

interface SettingsContextType extends Settings {
    updateSettings: (settings: Partial<Omit<Settings, 'isConfigured'>>) => void;
    clearSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettingsState] = useState<Settings>(() => {
        const saved = localStorage.getItem('workoutBinderSettings');
        return saved ? JSON.parse(saved) : {
            stravaClientId: '',
            stravaClientSecret: '',
            openAiApiKey: '',
            hevyApiKey: '',
            distanceUnit: 'kilometers',
            weightUnit: 'kg',
            isConfigured: false
        };
    });

    useEffect(() => {
        localStorage.setItem('workoutBinderSettings', JSON.stringify(settings));
    }, [settings]);

    const updateSettings = (newSettings: Partial<Omit<Settings, 'isConfigured'>>) => {
        setSettingsState(prev => {
            const updated = { ...prev, ...newSettings };
            const isConfigured = Boolean(
                updated.stravaClientId &&
                updated.stravaClientSecret &&
                updated.openAiApiKey
            );
            return { ...updated, isConfigured };
        });
    };

    const clearSettings = () => {
        setSettingsState({
            stravaClientId: '',
            stravaClientSecret: '',
            openAiApiKey: '',
            hevyApiKey: '',
            distanceUnit: 'kilometers',
            weightUnit: 'kg',
            isConfigured: false
        });
    };

    return (
        <SettingsContext.Provider value={{ ...settings, updateSettings, clearSettings }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}
