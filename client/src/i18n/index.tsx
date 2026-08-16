import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { en } from './en';

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

// API URL
const API_URL = 'http://localhost:3000/api';

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
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('pos-language');
    return (saved as Language) || 'en';
  });

  // Custom translations from database
  const [customTranslations, setCustomTranslations] = useState<Record<Language, Record<string, string>>>({
    en: {},
    bn: {},
    ar: {},
    hi: {},
  });

  // Fetch custom translations from API
  const fetchTranslations = async () => {
    try {
      const res = await fetch(`${API_URL}/translations`);
      if (res.ok) {
        const data = await res.json();
        setCustomTranslations(data);
      }
    } catch (error) {
      console.log('Using default translations');
    }
  };

  useEffect(() => {
    fetchTranslations();
  }, []);

  // Sync translations to server
  const syncTranslations = async () => {
    try {
      await fetch(`${API_URL}/translations/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ translations: defaultTranslations }),
      });
      await fetchTranslations();
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  // Save a custom translation
  const saveTranslation = async (lang: Language, key: string, value: string) => {
    try {
      await fetch(`${API_URL}/translations/${lang}/${key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });
      
      // Update local state
      setCustomTranslations(prev => ({
        ...prev,
        [lang]: {
          ...prev[lang],
          [key]: value,
        },
      }));
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('pos-language', lang);
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
