// Font detection for Bengali/English dynamic switching
// Detects if a character is Bengali or English and applies appropriate font

const BENGALI_RANGE = /[\u0980-\u09FF]/;

export function isBengaliText(text) {
  if (!text) return false;
  // Check if more than 30% of characters are Bengali
  const bengaliChars = text.match(BENGALI_RANGE);
  return bengaliChars && bengaliChars.length / text.length > 0.3;
}

export function detectFontForText(text) {
  if (isBengaliText(text)) {
    return "'Hind Siliguri', 'Noto Sans Bengali', sans-serif";
  }
  return "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
}

export function initFontDetection() {
  // Add dynamic font styling to text nodes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'characterData') {
        const node = mutation.target;
        if (node.nodeType === Node.TEXT_NODE) {
          const parent = node.parentElement;
          if (parent && !parent.classList.contains('font-detected')) {
            const text = node.textContent;
            if (isBengaliText(text)) {
              parent.style.fontFamily = "'Hind Siliguri', 'Noto Sans Bengali', sans-serif";
              parent.classList.add('font-detected');
            }
          }
        }
      }
    });
  });

  // Start observing when DOM is ready
  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
      });
    });
  }

  // Add CSS for Bengali fonts
  const style = document.createElement('style');
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap');
    
    /* Bengali text styling */
    [lang="bn"], .bengali {
      font-family: 'Hind Siliguri', 'Noto Sans Bengali', sans-serif;
    }
  `;
  document.head.appendChild(style);
}

// Auto-apply font to elements with Bengali text
export function applyFontToElement(element) {
  if (!element) return;
  
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );

  let node;
  while (node = walker.nextNode()) {
    const text = node.textContent;
    if (isBengaliText(text)) {
      const parent = node.parentElement;
      if (parent) {
        parent.style.fontFamily = "'Hind Siliguri', 'Noto Sans Bengali', sans-serif";
      }
    }
  }
}

export default {
  isBengaliText,
  detectFontForText,
  initFontDetection,
  applyFontToElement
};
