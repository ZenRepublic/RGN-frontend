import React, { useState, useRef, useEffect } from 'react';
import { getShortMonthDayDate } from '../../utils'
import './DaySelector.css';

interface DaySelectorProps {
  onDateSelect: (timestamp: number) => void;
}

const DaySelector: React.FC<DaySelectorProps> = ({ onDateSelect }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [selectedDate, setSelectedDate] = useState<number>(today.getTime());
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
  const isDraggingRef = useRef(false);
  const lastXRef = useRef(0);
  const lastTimeRef = useRef(0);
  const velocityRef = useRef(0);
  const animationRef = useRef<number | null>(null);
  const hasDraggedRef = useRef(false);

  // Generate array of dates from -7 to +7 days
  const generateDates = () => {
    const dates = [];
    for (let i = -7; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const dates = generateDates();

  const isToday = (date: Date) => {
    return date.getTime() === today.getTime();
  };

  // Function to scroll a button to the center of the container
  const scrollToCenter = (timestamp: number) => {
    const button = buttonRefs.current.get(timestamp);
    const container = containerRef.current;

    if (!button || !container) return;

    // Cancel any momentum animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    const containerWidth = container.offsetWidth;
    const buttonLeft = button.offsetLeft;
    const buttonWidth = button.offsetWidth;

    // Calculate scroll position to center the button
    const scrollPosition = buttonLeft - (containerWidth / 2) + (buttonWidth / 2);

    container.scrollTo({
      left: scrollPosition,
      behavior: 'smooth'
    });
  };

  // Center today's button on initial load
  useEffect(() => {
    // Small delay to ensure buttons are rendered
    setTimeout(() => {
      scrollToCenter(today.getTime());
    }, 100);
  }, []);

  const handleDateClick = (date: Date) => {
    // Only trigger click if there was no drag
    if (hasDraggedRef.current) {
      return;
    }
    const timestamp = date.getTime();
    setSelectedDate(timestamp);
    onDateSelect(timestamp);

    // Scroll to center the selected button
    scrollToCenter(timestamp);
  };

  // Momentum scrolling animation
  const startMomentum = () => {
    if (!containerRef.current) return;

    // Cancel any existing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const friction = 0.95; // Deceleration factor
    const minVelocity = 0.1; // Stop when velocity is too small

    const animate = () => {
      if (!containerRef.current) return;

      velocityRef.current *= friction;

      // Stop if velocity is too small
      if (Math.abs(velocityRef.current) < minVelocity) {
        animationRef.current = null;
        return;
      }

      containerRef.current.scrollLeft -= velocityRef.current;
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  // Drag-to-scroll handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;

    // Cancel momentum animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    lastXRef.current = e.clientX;
    lastTimeRef.current = Date.now();
    velocityRef.current = 0;
    containerRef.current.style.cursor = 'grabbing';
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    e.preventDefault();

    const now = Date.now();
    const dt = now - lastTimeRef.current;
    const dx = e.clientX - lastXRef.current;

    // Calculate velocity (pixels per millisecond)
    if (dt > 0) {
      velocityRef.current = dx / dt * 16; // Scale to ~60fps
    }

    // Mark as dragged if moved more than 5px
    if (Math.abs(dx) > 5) {
      hasDraggedRef.current = true;
    }

    containerRef.current.scrollLeft -= dx;

    lastXRef.current = e.clientX;
    lastTimeRef.current = now;
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    if (containerRef.current) {
      containerRef.current.style.cursor = 'grab';
    }

    // Start momentum animation
    startMomentum();

    // Reset drag flag after a short delay to allow click handler to check it
    setTimeout(() => {
      hasDraggedRef.current = false;
    }, 50);
  };

  const handleMouseLeave = () => {
    if (isDraggingRef.current && containerRef.current) {
      isDraggingRef.current = false;
      containerRef.current.style.cursor = 'grab';
      startMomentum();
    }
  };

  return (
    <div className="day-selector">
      <div
        ref={containerRef}
        className="day-selector-container"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {dates.map((date) => {
          const timestamp = date.getTime();
          const isSelected = timestamp === selectedDate;

          return (
            <button
              key={timestamp}
              ref={(el) => {
                if (el) {
                  buttonRefs.current.set(timestamp, el);
                } else {
                  buttonRefs.current.delete(timestamp);
                }
              }}
              className={`glass ${isSelected ? ' selected' : ''}`}
              onClick={() => handleDateClick(date)}
            >
              {isToday(date) ? 'TODAY' : getShortMonthDayDate(date)}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DaySelector;
