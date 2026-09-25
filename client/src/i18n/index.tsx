import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { en } from './en';
import { api, setApiLang } from '../api';

// Types
export type Language = 'en' | 'bn' | 'ar' | 'hi';

export interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
  rtl: boolean;
}

export const languages: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', rtl: false },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩', rtl: false },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', rtl: true },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', rtl: false },
];

// Default translations (from code)
import { bn } from './bn';
import { ar } from './ar';
import { hi } from './hi';

const defaultTranslations: Record<Language, Record<string, string>> = {
  en,
  bn,
  ar,
  hi,
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
  currentLang: LanguageOption;
  customTranslations: Record<Language, Record<string, string>>;
  syncTranslations: () => Promise<void>;
  saveTranslation: (lang: Language, key: string, value: string) => Promise<void>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');
  const [customTranslations, setCustomTranslations] = useState<Record<Language, Record<string, string>>>({
    en: {},
    bn: {},
    ar: {},
    hi: {},
  });
  const [isDbReady, setIsDbReady] = useState(false);

  // Initialize language + custom translations from the database
  useEffect(() => {
    const initLanguage = async () => {
      try {
        const s: any = await api.getSettings();
        const savedLang = (s && s.language) as Language | undefined;
        if (savedLang && defaultTranslations[savedLang]) {
          setLanguageState(savedLang);
          setApiLang(savedLang);
        } else {
          setApiLang(navigator.language.slice(0, 2) || 'en');
        }

        let savedTranslations: any = null;
        try { savedTranslations = s && s.translations ? JSON.parse(String(s.translations)) : null; } catch {}
        if (savedTranslations && typeof savedTranslations === 'object') {
          setCustomTranslations({ en: {}, bn: {}, ar: {}, hi: {}, ...savedTranslations });
        }
      } catch (error) {
        console.error('Failed to load language settings:', error);
      } finally {
        setIsDbReady(true);
      }
    };

    initLanguage();
  }, []);

  // Re-read language + translations whenever a session starts
  useEffect(() => {
    const reload = async () => {
      try {
        const s: any = await api.getSettings();
        const savedLang = (s && s.language) as Language | undefined;
        if (savedLang && defaultTranslations[savedLang]) {
          setLanguageState(savedLang);
          setApiLang(savedLang);
        }
      } catch {}
    };
    window.addEventListener('pos:session', reload);
    return () => window.removeEventListener('pos:session', reload);
  }, []);

  // Save custom translations to the database
  const saveCustomTranslationsToDb = async (translations: Record<Language, Record<string, string>>) => {
    try {
      await api.updateSettings({ translations: JSON.stringify(translations) });
    } catch (error) {
      console.error('Failed to save translations:', error);
    }
  };

  // Sync translations (they are already read from the database on mount)
  const syncTranslations = async () => {
    // no-op
  };

  // Save a custom translation to the database
  const saveTranslation = async (lang: Language, key: string, value: string) => {
    const newTranslations = {
      ...customTranslations,
      [lang]: {
        ...customTranslations[lang],
        [key]: value,
      },
    };
    setCustomTranslations(newTranslations);
    await saveCustomTranslationsToDb(newTranslations);
  };

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    setApiLang(lang);
    try {
      await api.updateSettings({ language: lang });
    } catch (error) {
      console.error('Failed to save language:', error);
    }
  };

  // Translation function - uses custom first, then default
  const t = (key: string): string => {
    // Check custom translations first
    const customValue = customTranslations[language]?.[key];
    if (customValue !== undefined) {
      return customValue;
    }
    // Fall back to default translations
    const defaultValue = defaultTranslations[language]?.[key];
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    // Last resort: English
    const enValue = defaultTranslations.en?.[key];
    if (enValue !== undefined) {
      return enValue;
    }
    // Return key if not found
    return key;
  };

  const currentLang = languages.find(l => l.code === language) || languages[0];
  const isRTL = currentLang.rtl;

  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language, isRTL]);

  // Don't render children until DB is ready
  if (!isDbReady) {
    return null;
  }

  return (
    <LanguageContext.Provider value={{ 
      language, 
      setLanguage, 
      t, 
      isRTL, 
      currentLang,
      customTranslations,
      syncTranslations,
      saveTranslation,
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Export default translations for sync
export { en, bn, ar, hi };
export { defaultTranslations };
