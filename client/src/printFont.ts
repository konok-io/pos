import type { Language } from './i18n';

let printLang: Language = 'en';

export const setPrintLang = (lang: Language): void => {
  printLang = lang;
};

interface PrintFont {
  import: string;
  family: string;
}

const FONTS: Record<Language, PrintFont> = {
  bn: {
    import: "@import url('https://fonts.googleapis.com/css2?family=Tiro+Bangla&display=swap');",
    family: "'Tiro Bangla','Noto Sans Bengali','Bangla Sangam MN',sans-serif",
  },
  ar: {
    import: "@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');",
    family: "'Cairo','Geeza Pro','Arabic Typesetting','Noto Naskh Arabic',sans-serif",
  },
  hi: {
    import: "@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700&display=swap');",
    family: "'Noto Sans Devanagari','Kohinoor Devanagari','Nirmala UI',sans-serif",
  },
  en: {
    import: '',
    family: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif",
  },
};

export const printFontImport = (): string => (FONTS[printLang] && FONTS[printLang].import) || '';

export const printFontFamily = (): string => (FONTS[printLang] && FONTS[printLang].family) || FONTS.en.family;
