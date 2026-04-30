import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Animations = 'simple' | 'balanced' | 'luxurious';

interface Settings {
  accentColor: string;
  captionsEnabled: boolean;
  captionLang: string;
  animations: Animations;
}

const defaultSettings: Settings = {
  accentColor: 'facc15',
  captionsEnabled: true,
  captionLang: 'en',
  animations: 'balanced',
};

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('animedia_settings');
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem('animedia_settings', JSON.stringify(settings));
    
    // Apply to DOM
    document.documentElement.style.setProperty('--color-accent', '#' + settings.accentColor.replace('#', ''));
    document.documentElement.setAttribute('data-ui-style', 'smooth');
    document.documentElement.setAttribute('data-animation-intensity', settings.animations);
  }, [settings]);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
