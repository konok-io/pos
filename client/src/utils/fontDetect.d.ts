export function hasBengali(text: string): boolean;
export function isEnglishOnly(text: string): boolean;
export function getFontClass(text: string): string;
export function applyFontToElement(element: HTMLElement): void;
export function applyFontsToChildren(parent: HTMLElement): void;
export function initFontDetection(): void;
export function bengaliToEnglish(text: string): string;
export function englishToBengali(text: string): string;
export function convertBengaliDigits(input: HTMLInputElement): void;

export default {
  hasBengali,
  isEnglishOnly,
  getFontClass,
  applyFontToElement,
  applyFontsToChildren,
  initFontDetection,
  bengaliToEnglish,
  englishToBengali,
  convertBengaliDigits,
};
