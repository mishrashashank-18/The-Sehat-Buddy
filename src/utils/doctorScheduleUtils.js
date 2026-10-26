/**
 * Utility to parse doctor Available Hours / Days string into structured days array
 * and formatted time slots.
 * 
 * Examples handled:
 * - "Mon - Sat (10am - 4pm)"
 * - "Mon - Fri (09:00 AM - 2:00 PM)"
 * - "Tue, Thu, Sat (11am - 5pm)"
 * - "Mon to Fri (10:00 AM to 1:00 PM)"
 * - "All Days (10am - 7pm)"
 */
export const parseAvailableDaysAndHours = (str, slotDuration = 30) => {
  if (!str || typeof str !== 'string' || !str.trim()) {
    return {
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      slots: ['10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM']
    };
  }

  const raw = str.trim();
  const allWeekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dayAliases = {
    'monday': 'Mon', 'mon': 'Mon',
    'tuesday': 'Tue', 'tue': 'Tue', 'tues': 'Tue',
    'wednesday': 'Wed', 'wed': 'Wed',
    'thursday': 'Thu', 'thu': 'Thu', 'thur': 'Thu', 'thurs': 'Thu',
    'friday': 'Fri', 'fri': 'Fri',
    'saturday': 'Sat', 'sat': 'Sat',
    'sunday': 'Sun', 'sun': 'Sun'
  };

  // 1. Separate days part and hours part
  let daysPart = raw;
  let hoursPart = '';

  const parenMatch = raw.match(/^(.*?)\s*\((.*?)\)$/);
  if (parenMatch) {
    daysPart = parenMatch[1].trim();
    hoursPart = parenMatch[2].trim();
  } else if (raw.includes(':') && (raw.toLowerCase().includes('am') || raw.toLowerCase().includes('pm'))) {
    const parts = raw.split(/:\s*(?=\d)/);
    if (parts.length > 1) {
      daysPart = parts[0].trim();
      hoursPart = parts.slice(1).join(':').trim();
    }
  }

  // 2. Resolve Days
  let resolvedDays = [];
  const lowerDays = daysPart.toLowerCase();

  if (
    lowerDays.includes('all days') ||
    lowerDays.includes('everyday') ||
    lowerDays.includes('daily') ||
    lowerDays.includes('mon - sun') ||
    lowerDays.includes('mon to sun')
  ) {
    resolvedDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  } else if (lowerDays.includes('-') || lowerDays.includes('to') || lowerDays.includes('–')) {
    const rangeParts = lowerDays.split(/\s*(?:-|to|–)\s*/);
    const startAlias = dayAliases[rangeParts[0]?.trim()];
    const endAlias = dayAliases[rangeParts[1]?.trim()];
    if (startAlias && endAlias) {
      const startIdx = allWeekdays.indexOf(startAlias);
      const endIdx = allWeekdays.indexOf(endAlias);
      if (startIdx !== -1 && endIdx !== -1 && startIdx <= endIdx) {
        resolvedDays = allWeekdays.slice(startIdx, endIdx + 1);
      }
    }
  }

  if (resolvedDays.length === 0) {
    const tokens = lowerDays.split(/[\s,]+/);
    for (const tok of tokens) {
      const alias = dayAliases[tok];
      if (alias && !resolvedDays.includes(alias)) {
        resolvedDays.push(alias);
      }
    }
  }

  if (resolvedDays.length === 0) {
    resolvedDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  }

  // 3. Resolve Hours into Slots
  let resolvedSlots = [];
  if (hoursPart) {
    const timeMatch = hoursPart.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:-|to|–)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
    if (timeMatch) {
      const parseTimeToMinutes = (tStr, fallbackPeriod = null) => {
        if (!tStr) return null;
        const clean = tStr.trim().toLowerCase();
        const hasPM = clean.includes('pm');
        const hasAM = clean.includes('am');
        const numOnly = clean.replace(/[^0-9:]/g, '');
        let [h, m] = numOnly.split(':').map(Number);
        if (isNaN(m)) m = 0;
        if (isNaN(h)) return null;

        let period = hasPM ? 'pm' : (hasAM ? 'am' : fallbackPeriod);
        if (period === 'pm' && h < 12) h += 12;
        if (period === 'am' && h === 12) h = 0;
        return h * 60 + m;
      };

      const secondClean = timeMatch[2].toLowerCase();
      const secondPeriod = secondClean.includes('pm') ? 'pm' : (secondClean.includes('am') ? 'am' : 'pm');
      
      let startMin = parseTimeToMinutes(timeMatch[1], secondPeriod === 'pm' && parseInt(timeMatch[1], 10) >= 8 && parseInt(timeMatch[1], 10) <= 11 ? 'am' : secondPeriod);
      let endMin = parseTimeToMinutes(timeMatch[2], secondPeriod);

      if (startMin !== null && endMin !== null) {
        if (endMin <= startMin && endMin < 12 * 60) {
          endMin += 12 * 60;
        }

        const step = Math.max(15, Math.min(60, Number(slotDuration) || 30));
        for (let t = startMin; t < endMin; t += step) {
          let h = Math.floor(t / 60);
          const m = t % 60;
          const period = h >= 12 ? 'PM' : 'AM';
          let displayH = h % 12;
          if (displayH === 0) displayH = 12;
          const slotStr = `${String(displayH).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
          resolvedSlots.push(slotStr);
        }
      }
    }
  }

  if (resolvedSlots.length === 0) {
    resolvedSlots = ['10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM'];
  }

  return { days: resolvedDays, slots: resolvedSlots };
};
