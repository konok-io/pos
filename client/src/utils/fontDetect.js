/**
 * Font Detection Utility
 * Dynamically detects Bengali vs English text and applies appropriate font
 * Converts Bengali digits to English digits for number inputs
 */


// Regex to detect Bengali characters (Unicode range: U+0980-U+09FF)
const BENGALI_REGEX = /[\u0980-\u09FF]/;


// Regex to detect English characters only (A-Z, a-z, 0-9, basic punctuation)
const ENGLISH_ONLY_REGEX = /^[A-Za-z0-9\s\-\_\.\,\!\?\@\#\$\%\^\&\*\(\)\+\=\[\]\{\}\\\|\;\:'"<>\/\?\`\~\,]+$/;


// Bengali to English digit mapping
const BENGALI_TO_ENGLISH = {
  '০': '0',
  '১': '1',
  '২': '2',
  '৩': '3',
  '৪': '4',
  '৫': '5',
  '৬': '6',
  '৭': '7',
  '৮': '8',
  '৯': '9'
};


// English to Bengali digit mapping
const ENGLISH_TO_BENGALI = {
  '0': '০',
  '1': '১',
  '2': '২',
  '3': '৩',
  '4': '৪',
  '5': '৫',
  '6': '৬',
  '7': '৭',
  '8': '৮',
  '9': '৯'
};


/**
 * Convert Bengali digits to English digits
 * @param {string} text - The text to convert
 * @returns {string} - Text with Bengali digits converted to English
 */
export function bengaliToEnglish(text) {
  if (!text || typeof text !== 'string') return text;
  return text.replace(/[০-৯]/g, match => BENGALI_TO_ENGLISH[match] || match);
}


/**
 * Convert English digits to Bengali digits
 * @param {string} text - The text to convert
 * @returns {string} - Text with English digits converted to Bengali
 */
export function englishToBengali(text) {
  if (!text || typeof text !== 'string') return text;
  return text.replace(/[0-9]/g, match => ENGLISH_TO_BENGALI[match] || match);
}


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
 * Check if text is English only (no Bengali characters)
 * @param {string} text - The text to check
 * @returns {boolean} - True if text is English only
 */
export function isEnglishOnly(text) {
  if (!text || typeof text !== 'string') return true;
  return ENGLISH_ONLY_REGEX.test(text);
}


/**
 * Get font class based on text content
 * @param {string} text - The text to check
 * @returns {string} - 'bengali-font' or 'english-font'
 */
export function getFontClass(text) {
  // If has Bengali characters, use Bengali font
  if (hasBengali(text)) {
    return 'bengali-font';
  }
  // If English only, use English font
  if (isEnglishOnly(text)) {
    return 'english-font';
  }
  // Default to Bengali for mixed content
  return 'bengali-font';
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
    initNumberInputConversion();
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


/**
 * Initialize Bengali to English digit conversion for number inputs
 */
function initNumberInputConversion() {
  // Find all number inputs and add event listeners
  const numberInputs = document.querySelectorAll('input[type="number"], input[type="tel"], input.input-number, input.price, input.amount, input.quantity, input.total');
  
  numberInputs.forEach(input => {
    // Remove existing listeners to avoid duplicates
    input.removeEventListener('input', handleNumberInput);
    input.addEventListener('input', handleNumberInput);
    input.removeEventListener('keypress', handleNumberKeypress);
    input.addEventListener('keypress', handleNumberKeypress);
  });
}


/**
 * Handle input event - convert Bengali digits to English
 */
function handleNumberInput(e) {
  const input = e.target;
  let value = input.value;
  
  // Convert Bengali digits to English
  let hasBengaliDigits = false;
  const converted = value.replace(/[০-৯]/g, char => {
    hasBengaliDigits = true;
    return BENGALI_TO_ENGLISH[char] || char;
  });
  
  // If Bengali digits found, update value
  if (hasBengaliDigits && converted !== value) {
    // Save cursor position
    const start = input.selectionStart;
    const end = input.selectionEnd;
    
    // Update value
    input.value = converted;
    
    // Restore cursor position (adjusted for digit replacement)
    const diff = converted.length - value.length;
    input.setSelectionRange(start + diff, end + diff);
    
    // Dispatch input event for React
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }
}


/**
 * Handle keypress - convert Bengali digits to English on the fly
 */
function handleNumberKeypress(e) {
  const char = String.fromCharCode(e.which || e.keyCode);
  
  // Check if it's a Bengali digit
  if (BENGALI_TO_ENGLISH[char]) {
    e.preventDefault();
    
    const input = e.target;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    
    // Replace Bengali digit with English
    const englishDigit = BENGALI_TO_ENGLISH[char];
    const newValue = input.value.substring(0, start) + englishDigit + input.value.substring(end);
    
    input.value = newValue;
    input.setSelectionRange(start + 1, start + 1);
    
    // Dispatch events
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }
}


/**
 * Convert Bengali digits to English in number inputs
 * Call this on input event for number fields
 */
export function convertBengaliDigits(input) {
  if (!input) return;
  const value = input.value || '';
  input.value = bengaliToEnglish(value);
}


export default {
  hasBengali,
  isEnglishOnly,
  getFontClass,
  applyFontToElement,
  applyFontsToChildren,
  initFontDetection,
  bengaliToEnglish,
  englishToBengali,
  convertBengaliDigits
};
