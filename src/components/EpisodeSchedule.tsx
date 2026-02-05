import { useState, useEffect } from 'react';
import DaySelector from './DaySelector';
import MatchDisplay from './MatchDisplay';
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

        console.log('EpisodeSchedule: Fetching episodes for range:', startDate.toISOString(), 'to', endDate.toISOString());

        const episodes = await fetchEpisodesByDateRange({
          startTimestamp: startDate.getTime(),
          endTimestamp: endDate.getTime(),
          collectionId,
          includeEpisodeData: true,
        });

        console.log('EpisodeSchedule: Fetched', episodes.length, 'episodes total');
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
    console.log('EpisodeSchedule: Date selected:', new Date(timestamp).toISOString());
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

  console.log('EpisodeSchedule: Filtered', selectedDayEpisodes.length, 'episodes for selected day');

  return (
    <div className="episode-schedule">
        <DaySelector onDateSelect={handleDateSelect} />

      <div className="episode-schedule-content">
        <div className="tv-container">
          <div className="tv-screen">
            {loading ? (
              <div className="match-loader-loading">Loading episodes...</div>
            ) : selectedDayEpisodes.length === 0 ? (
              <div className="match-loader-empty">No episodes scheduled for this day yet...</div>
            ) : (
              <div className="match-loader-grid">
                {selectedDayEpisodes.map((episode) => (
                  <MatchDisplay key={episode.id} asset={episode} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
