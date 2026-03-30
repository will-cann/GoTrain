import React, { createContext, useContext, useState, useEffect } from 'react';

interface ServerConfig {
    stravaConfigured: boolean;
    openaiConfigured: boolean;
    hevyConfigured: boolean;
}

interface Settings {
    stravaClientId: string;
    stravaClientSecret: string;
    openAiApiKey: string;
    hevyApiKey: string;
    distanceUnit: 'kilometers' | 'miles';
    weightUnit: 'kg' | 'lbs';
    isConfigured: boolean;
    useProxy: boolean;
    serverConfig: ServerConfig | null;
}

interface SettingsContextType extends Settings {
    updateSettings: (settings: Partial<Omit<Settings, 'isConfigured' | 'useProxy' | 'serverConfig'>>) => void;
    clearSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettingsState] = useState<Settings>(() => {
        const saved = localStorage.getItem('workoutBinderSettings');
        const parsed = saved ? JSON.parse(saved) : {};
        return {
            stravaClientId: parsed.stravaClientId || '',
            stravaClientSecret: parsed.stravaClientSecret || '',
            openAiApiKey: parsed.openAiApiKey || '',
            hevyApiKey: parsed.hevyApiKey || '',
            distanceUnit: parsed.distanceUnit || 'kilometers',
            weightUnit: parsed.weightUnit || 'kg',
            isConfigured: parsed.isConfigured || false,
            useProxy: false,
            serverConfig: null,
        };
    });

    // Check if server-side API keys are configured
    useEffect(() => {
        fetch('/api/config')
            .then(res => res.json())
            .then((config: ServerConfig) => {
                const serverReady = config.stravaConfigured && config.openaiConfigured;
                setSettingsState(prev => ({
                    ...prev,
                    serverConfig: config,
                    useProxy: serverReady,
                    isConfigured: serverReady || Boolean(
                        prev.stravaClientId && prev.stravaClientSecret && prev.openAiApiKey
                    ),
                }));
            })
            .catch(() => {
                // Server config not available (local dev without Netlify), use client-side keys
            });
    }, []);

    useEffect(() => {
        // Persist only user-editable fields
        const { serverConfig, useProxy, ...persistable } = settings;
        localStorage.setItem('workoutBinderSettings', JSON.stringify(persistable));
    }, [settings]);

    const updateSettings = (newSettings: Partial<Omit<Settings, 'isConfigured' | 'useProxy' | 'serverConfig'>>) => {
        setSettingsState(prev => {
            const updated = { ...prev, ...newSettings };
            const isConfigured = updated.useProxy || Boolean(
                updated.stravaClientId &&
                updated.stravaClientSecret &&
                updated.openAiApiKey
            );
            return { ...updated, isConfigured };
        });
    };

    const clearSettings = () => {
        setSettingsState(prev => ({
            stravaClientId: '',
            stravaClientSecret: '',
            openAiApiKey: '',
            hevyApiKey: '',
            distanceUnit: 'kilometers',
            weightUnit: 'kg',
            isConfigured: prev.useProxy,
            useProxy: prev.useProxy,
            serverConfig: prev.serverConfig,
        }));
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
