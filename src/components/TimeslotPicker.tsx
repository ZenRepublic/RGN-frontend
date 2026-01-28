import { useState, useMemo } from 'react';
import './TimeslotPicker.css';

interface TimeslotPickerProps {
  onSelect?: (utcTimestamp: string) => void;
}

export default function TimeslotPicker({ onSelect }: TimeslotPickerProps) {
  const isCurrentlyPM = () => new Date().getHours() >= 12;

  const [dayOffset, setDayOffset] = useState(0);
  const [isPM, setIsPM] = useState(isCurrentlyPM);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [selectedMinute, setSelectedMinute] = useState<number | null>(null);

  const minutes = [0, 15, 30, 45];
  const hours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

  // AM is disabled if it's currently PM and we're on today
  const isAMDisabled = dayOffset === 0 && isCurrentlyPM();

  const selectedDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + dayOffset);
    return date;
  }, [dayOffset]);

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    };
    return date.toLocaleDateString(undefined, options);
  };

  const handlePrevDay = () => {
    if (dayOffset > 0) {
      const newOffset = dayOffset - 1;
      setDayOffset(newOffset);
      // If going back to today and it's currently PM, force PM
      if (newOffset === 0 && isCurrentlyPM()) {
        setIsPM(true);
      }
      resetSelection();
    }
  };

  const handleNextDay = () => {
    if (dayOffset < 6) {
      setDayOffset(dayOffset + 1);
      resetSelection();
    }
  };

  const resetSelection = () => {
    setSelectedHour(null);
    setSelectedMinute(null);
  };

  const handleTogglePeriod = (pm: boolean) => {
    // Don't allow switching to AM if it's disabled
    if (!pm && isAMDisabled) return;
    setIsPM(pm);
    resetSelection();
  };

  const handleSlotClick = (hour: number, minute: number) => {
    setSelectedHour(hour);
    setSelectedMinute(minute);

    // Convert to 24-hour format
    let hour24 = hour;
    if (isPM && hour !== 12) {
      hour24 = hour + 12;
    } else if (!isPM && hour === 12) {
      hour24 = 0;
    }

    // Construct local date with selected time
    const localDate = new Date(selectedDate);
    localDate.setHours(hour24, minute, 0, 0);

    // Convert to UTC ISO string
    const utcTimestamp = localDate.toISOString();

    console.log('Selected timestamp (UTC):', utcTimestamp);
    console.log('Local time:', localDate.toLocaleString());

    onSelect?.(utcTimestamp);
  };

  const isSlotSelected = (hour: number, minute: number) => {
    return selectedHour === hour && selectedMinute === minute;
  };

  const isSlotInPast = (hour: number, minute: number) => {
    if (dayOffset > 0) return false;

    const now = new Date();
    let hour24 = hour;
    if (isPM && hour !== 12) {
      hour24 = hour + 12;
    } else if (!isPM && hour === 12) {
      hour24 = 0;
    }

    const slotTime = new Date();
    slotTime.setHours(hour24, minute, 0, 0);

    return slotTime <= now;
  };

  return (
    <div className="timeslot-picker">
      <div className="timeslot-header">
        <button
          type="button"
          className="timeslot-nav-btn"
          onClick={handlePrevDay}
          disabled={dayOffset === 0}
          aria-label="Previous day"
        >
          ‹
        </button>
        <span className="timeslot-date">{formatDate(selectedDate)}</span>
        <button
          type="button"
          className="timeslot-nav-btn"
          onClick={handleNextDay}
          disabled={dayOffset === 6}
          aria-label="Next day"
        >
          ›
        </button>
      </div>

      <div className="timeslot-period-toggle">
        <button
          type="button"
          className={`timeslot-period-btn ${!isPM ? 'active' : ''}`}
          onClick={() => handleTogglePeriod(false)}
          disabled={isAMDisabled}
        >
          AM
        </button>
        <button
          type="button"
          className={`timeslot-period-btn ${isPM ? 'active' : ''}`}
          onClick={() => handleTogglePeriod(true)}
        >
          PM
        </button>
      </div>

      <div className="timeslot-grid">
        {hours.map((hour) => (
          <div key={hour} className="timeslot-row">
            {minutes.map((min) => {
              const inPast = isSlotInPast(hour, min);
              const selected = isSlotSelected(hour, min);
              const timeLabel = `${hour}:${min.toString().padStart(2, '0')}${isPM ? 'PM' : 'AM'}`;

              return (
                <button
                  key={min}
                  type="button"
                  className={`timeslot-cell ${selected ? 'selected' : ''} ${inPast ? 'disabled' : ''}`}
                  onClick={() => !inPast && handleSlotClick(hour, min)}
                  disabled={inPast}
                  aria-label={timeLabel}
                >
                  {timeLabel}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
