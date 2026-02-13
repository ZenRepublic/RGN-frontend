import { useState, useEffect } from 'react';
import './CountdownTimer.css';

interface CountdownTimerProps {
  startTime: string;
}

export function CountdownTimer({ startTime }: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  // Update countdown timer every second
  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const target = new Date(startTime).getTime();
      const remaining = Math.max(0, target - now);
      setTimeRemaining(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const formatCountdown = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours}h ${minutes.toString().padStart(2, '0')}min ${seconds.toString().padStart(2, '0')}sec`;
  };

  if (timeRemaining === 0) {
    return null;
  }

  return (
    <div className="voting-countdown">
      <div className="voting-countdown-label">Closes In</div>
      <div className="voting-countdown-timer">{formatCountdown(timeRemaining)}</div>
    </div>
  );
}
