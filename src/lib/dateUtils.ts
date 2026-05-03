/**
 * Highly robust date parser for Japanese and standard date formats.
 */
export const parseDateString = (dateStr: string): Date | null => {
  if (!dateStr) return null;

  // Normalize characters: Full-width to half-width, remove spaces, remove weekday parenthesis
  let cleaned = dateStr
    .replace(/[！-～]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0)) // Full-width to half-width
    .replace(/\s+/g, '') // Remove all whitespace
    .replace(/[（\(\[].*?[）\)\]]/g, '') // Remove (Wed) or [Anything]
    .trim();
  
  // Handle Japanese Era names (limited support for Reiwa)
  cleaned = cleaned.replace(/令和(\d+)/, (_, n) => (parseInt(n, 10) + 2018).toString());
  cleaned = cleaned.replace(/R(\d+)/i, (_, n) => (parseInt(n, 10) + 2018).toString());

  const now = new Date();
  const currentYear = now.getFullYear();

  // Try Year (4 or 2 digits) + Month + Day
  // Supports: 2026年4月15日, 26/4/15, 2026.4.15, 2026-4-15
  const ymdMatch = cleaned.match(/(\d{2,4})[年/.-](\d{1,2})[月/.-](\d{1,2})日?/);
  if (ymdMatch) {
    let [, y, m, d] = ymdMatch;
    let year = parseInt(y, 10);
    if (y.length === 2) {
      year += year > 50 ? 1900 : 2000;
    }
    return new Date(year, parseInt(m, 10) - 1, parseInt(d, 10));
  }

  // Try Month + Day (assumes current year)
  // Supports: 4月15日, 4/15, 04-15
  const mdMatch = cleaned.match(/(\d{1,2})[月/.-](\d{1,2})日?/);
  if (mdMatch) {
    const [, m, d] = mdMatch;
    return new Date(currentYear, parseInt(m, 10) - 1, parseInt(d, 10));
  }

  // Try Year + Month (with early/mid/late support)
  const ymMatch = cleaned.match(/(\d{2,4})[年/.-](\d{1,2})月?/);
  if (ymMatch) {
    let [, y, m] = ymMatch;
    let year = parseInt(y, 10);
    if (y.length === 2) {
      year += year > 50 ? 1900 : 2000;
    }
    let day = 1;
    if (cleaned.includes('上旬')) day = 1;
    else if (cleaned.includes('中旬')) day = 11;
    else if (cleaned.includes('下旬')) day = 21;
    return new Date(year, parseInt(m, 10) - 1, day);
  }

  // Try Month only (assumes current year)
  const mMatch = cleaned.match(/(\d{1,2})月/);
  if (mMatch) {
    const [, m] = mMatch;
    let day = 1;
    if (cleaned.includes('上旬')) day = 1;
    else if (cleaned.includes('中旬')) day = 11;
    else if (cleaned.includes('下旬')) day = 21;
    return new Date(currentYear, parseInt(m, 10) - 1, day);
  }

  return null;
};

/**
 * Returns 'open' if the store has already opened, 'soon' otherwise.
 */
export const getOpenStatus = (openDateStr: string): 'open' | 'soon' | null => {
  const openDate = parseDateString(openDateStr);
  if (!openDate) return null;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDate = new Date(openDate.getFullYear(), openDate.getMonth(), openDate.getDate());

  // Conservative handling for month-only dates
  const hasSpecificDay = openDateStr.includes('日') || !!openDateStr.match(/\d{1,2}[/-]\d{1,2}/);
  const hasPart = openDateStr.includes('上旬') || openDateStr.includes('中旬') || openDateStr.includes('下旬');

  if (!hasSpecificDay && !hasPart) {
    if (targetDate.getFullYear() === today.getFullYear() && 
        targetDate.getMonth() === today.getMonth()) {
      return 'soon'; 
    }
  }

  return targetDate <= today ? 'open' : 'soon';
};

/**
 * Returns true if the store opened within the last 30 days.
 */
export const getIsNew = (openDateStr: string): boolean => {
  const openDate = parseDateString(openDateStr);
  if (!openDate) return false;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDate = new Date(openDate.getFullYear(), openDate.getMonth(), openDate.getDate());

  const diffTime = today.getTime() - targetDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  // Must have opened today or in the past 30 days
  return diffDays >= 0 && diffDays <= 30;
};
