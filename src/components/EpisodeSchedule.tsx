import { useState, useEffect } from 'react';
import DaySelector from './DaySelector';
import EpisodeLoader from './EpisodeLoader';
import { fetchOrdersByRange, Order } from '@/utils/orderFetcher';
import './EpisodeSchedule.css';

interface EpisodeScheduleProps {
  channelId: string;
  onError?: (message: string) => void;
}

export default function EpisodeSchedule({ channelId, onError }: EpisodeScheduleProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [selectedTimestamp, setSelectedTimestamp] = useState<number>(today.getTime());
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all orders for the date range once on mount
  useEffect(() => {
    const fetchRange = async () => {
      setLoading(true);
      try {
        // Calculate date range: -7 to +7 days from today
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(today);
        endDate.setDate(today.getDate() + 7);
        endDate.setHours(23, 59, 59, 999);

        const orders = await fetchOrdersByRange({
          startDate,
          endDate,
          channelId,
        });

        setAllOrders(orders);
      } catch (error) {
        console.error('EpisodeSchedule: Failed to fetch orders:', error);
        onError?.('Failed to load episodes');
      } finally {
        setLoading(false);
      }
    };

    fetchRange();
  }, [channelId]);

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
    <div className="episode-schedule">
        <DaySelector onDateSelect={handleDateSelect} />

      <div className="episode-schedule-content">
        <div className="tv-container">
          <div className="tv-screen">
            <EpisodeLoader
              mode="assets"
              assets={selectedDayOrders}
              loading={loading}
              loadingText="Loading episodes..."
              emptyText="No episodes scheduled for this day yet..."
              onError={onError}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
