import { useState, useEffect } from 'react';
import DaySelector from './DaySelector';
import MatchLoader from './MatchLoader';
import { fetchEpisodesByDateRange, MplEpisodeAsset } from '@/utils/episodeFetcher';
import './EpisodeSchedule.css';

interface EpisodeScheduleProps {
  collectionId: string;
  onError?: (message: string) => void;
}

export default function EpisodeSchedule({ collectionId, onError }: EpisodeScheduleProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [selectedTimestamp, setSelectedTimestamp] = useState<number>(today.getTime());
  const [allEpisodes, setAllEpisodes] = useState<MplEpisodeAsset[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all episodes for the date range once on mount
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


        const episodes = await fetchEpisodesByDateRange({
          startTimestamp: startDate.getTime(),
          endTimestamp: endDate.getTime(),
          collectionId,
          includeEpisodeData: true,
        });

        setAllEpisodes(episodes);
      } catch (error) {
        console.error('EpisodeSchedule: Failed to fetch episodes:', error);
        onError?.('Failed to load episodes');
      } finally {
        setLoading(false);
      }
    };

    fetchRange();
  }, [collectionId]);

  const handleDateSelect = (timestamp: number) => {
    setSelectedTimestamp(timestamp);
  };

  // Filter episodes for the selected day
  const selectedDayEpisodes = allEpisodes.filter(episode => {
    if (!episode.episodeData?.startTime) return false;

    const episodeDate = new Date(episode.episodeData.startTime);
    const selectedDate = new Date(selectedTimestamp);

    // Compare dates (year, month, day only)
    return (
      episodeDate.getFullYear() === selectedDate.getFullYear() &&
      episodeDate.getMonth() === selectedDate.getMonth() &&
      episodeDate.getDate() === selectedDate.getDate()
    );
  });


  return (
    <div className="episode-schedule">
        <DaySelector onDateSelect={handleDateSelect} />

      <div className="episode-schedule-content">
        <div className="tv-container">
          <div className="tv-screen">
            <MatchLoader
              mode="assets"
              assets={selectedDayEpisodes}
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
