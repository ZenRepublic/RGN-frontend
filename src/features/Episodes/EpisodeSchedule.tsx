import { useState, useMemo } from 'react';
import DaySelector from './DaySelector';
import EpisodeGrid from './EpisodeGrid';
import { useOrdersByRange } from '../../hooks/useOrdersByRange';
import './EpisodeSchedule.css';


export default function EpisodeSchedule({ channelId }: {channelId : string}) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [selectedTimestamp, setSelectedTimestamp] = useState<number>(today.getTime());

  const startDate = useMemo(() => {
    const d = new Date(today);
    d.setDate(today.getDate() - 7);
    return d;
  }, [today]);

  const endDate = useMemo(() => {
    const d = new Date(today);
    d.setDate(today.getDate() + 7);
    d.setHours(23, 59, 59, 999);
    return d;
  }, [today]);

  const { orders: allOrders, loading } = useOrdersByRange({ startDate, endDate, channelId });

  const handleDateSelect = (timestamp: number) => {
    setSelectedTimestamp(timestamp);
  };

  // Filter orders for the selected day
  const selectedDayOrders = allOrders.filter(order => {
    if (!order.startTime) return false;

    const orderDate = new Date(order.startTime);
    const selectedDate = new Date(selectedTimestamp);

    // Compare dates (year, month, day only)
    return (
      orderDate.getFullYear() === selectedDate.getFullYear() &&
      orderDate.getMonth() === selectedDate.getMonth() &&
      orderDate.getDate() === selectedDate.getDate()
    );
  });


  return (
    <div>
      <DaySelector onDateSelect={handleDateSelect} />

      <div className="tv-container">
        <div className="tv-screen">
          <EpisodeGrid
            orders={selectedDayOrders}
            loading={loading}
            loadingText="Loading episodes..."
            emptyText="No episodes scheduled for this day yet..."
          />
        </div>
      </div>
    </div>
  );
}
