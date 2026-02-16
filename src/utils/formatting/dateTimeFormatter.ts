export const getShortMonthDayDate = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${month}.${day}`;
};

export function getLongMonthDayYearDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
};


export function getShortYearMonthDayDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export function getShortWeekDayDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    };
    return date.toLocaleDateString(undefined, options);
};

export function getFullAMPMDate(date: Date): string {
    const yy = String(date.getFullYear()).slice(2);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const h = date.getHours();
    const min = String(date.getMinutes()).padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${yy}/${mm}/${dd} ${h12}:${min}${ampm}`;
};

export function getTimeRemaining(endDate: Date | string): string | null {
    const now = Date.now();
    const target = new Date(endDate).getTime();

    if (now >= target) {
        return null;
    }

    const remaining = target - now;
    const totalSeconds = Math.floor(remaining / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours}h ${minutes.toString().padStart(2, '0')}min ${seconds.toString().padStart(2, '0')}sec`;
};