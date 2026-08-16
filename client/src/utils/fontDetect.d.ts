declare module './fontDetect.js' {
  export function hasBengali(text: string): boolean;
  export function isEnglishOnly(text: string): boolean;
  export function getFontClass(text: string): string;
  export function applyFontToElement(element: HTMLElement): void;
  export function applyFontsToChildren(parent: HTMLElement): void;
  export function initFontDetection(): void;
  export function bengaliToEnglish(text: string): string;
  export function englishToBengali(text: string): string;
  export function convertBengaliDigits(input: HTMLInputElement): void;

  const defaultExport: {
    hasBengali: typeof hasBengali;
    isEnglishOnly: typeof isEnglishOnly;
    getFontClass: typeof getFontClass;
    applyFontToElement: typeof applyFontToElement;
    applyFontsToChildren: typeof applyFontsToChildren;
    initFontDetection: typeof initFontDetection;
    bengaliToEnglish: typeof bengaliToEnglish;
    englishToBengali: typeof englishToBengali;
    convertBengaliDigits: typeof convertBengaliDigits;
  };
  export default defaultExport;
}
