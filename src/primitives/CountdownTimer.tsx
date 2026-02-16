import { useState, useEffect } from 'react';
import { getTimeRemaining } from '../utils'
import './CountdownTimer.css';

interface CountdownTimerProps {
  startTime: string;
}

export function CountdownTimer({ startTime }: CountdownTimerProps) {
  const [displayTime, setDisplayTime] = useState<string | null>(getTimeRemaining(startTime));

  useEffect(() => {
    const updateTimer = () => {
      setDisplayTime(getTimeRemaining(startTime));
    };

    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  if (!displayTime) {
    return null;
  }

  return (
    <div className="voting-countdown">
      <div className="voting-countdown-label">Closes In</div>
      <div className="voting-countdown-timer">{displayTime}</div>
    </div>
  );
}
