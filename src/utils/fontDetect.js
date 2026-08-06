/**
 * Font Detection Utility
 * Dynamically detects Bengali vs English text and applies appropriate font
 */

// Regex to detect Bengali characters (Unicode range: U+0980-U+09FF)
const BENGALI_REGEX = /[\u0980-\u09FF]/;

/**
 * Check if text contains Bengali characters
 * @param {string} text - The text to check
 * @returns {boolean} - True if text contains Bengali
 */
export function hasBengali(text) {
  if (!text || typeof text !== 'string') return false;
  return BENGALI_REGEX.test(text);
}

/**
 * Get font class based on text content
 * @param {string} text - The text to check
 * @returns {string} - 'bengali-font' or 'english-font'
 */
export function getFontClass(text) {
  return hasBengali(text) ? 'bengali-font' : 'english-font';
}

/**
 * Apply font class to an element based on its text content
 * @param {HTMLElement} element - The element to apply font class to
 */
export function applyFontToElement(element) {
  if (!element) return;
  const text = element.textContent || '';
  const fontClass = getFontClass(text);
  element.classList.remove('bengali-font', 'english-font');
  element.classList.add(fontClass);
}

/**
 * Recursively apply font classes to all child elements
 * @param {HTMLElement} parent - The parent element
 */
export function applyFontsToChildren(parent) {
  if (!parent) return;
  
  const elements = parent.querySelectorAll('*');
  elements.forEach(el => {
    if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.tagName === 'NOSCRIPT') return;
    
    const text = el.textContent || '';
    if (text.trim()) {
      applyFontToElement(el);
    }
  });
}

/**
 * Initialize font detection on the entire document
 */
export function initFontDetection() {
  if (typeof window === 'undefined') return;
  
  setTimeout(() => {
    applyFontsToChildren(document.body);
  }, 100);
  
  if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1) {
              applyFontsToChildren(node);
            }
          });
        }
      });
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
  }
}

export default {
  hasBengali,
  getFontClass,
  applyFontToElement,
  applyFontsToChildren,
  initFontDetection
};
