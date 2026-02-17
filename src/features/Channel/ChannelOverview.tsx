import { useState } from 'react';
import { useIsInAppWalletBrowser } from '@/utils/deviceChecker';
import EpisodeSchedule from '@/features/Episodes/EpisodeSchedule';
import TournamentManager from '@/features/Tournament/TournamentManager';
import { ChannelConfig } from '../../types/channel';
import { getIdByNetwork } from '.';
import './ChannelOverview.css';

interface ChannelOverviewProps {
  channel: ChannelConfig;
  onError?: (message: string) => void;
}

export default function ChannelOverview({ channel, onError }: ChannelOverviewProps) {
  const inWalletBrowser = useIsInAppWalletBrowser();
  const [videoError, setVideoError] = useState(false);
  const [activeTab, setActiveTab] = useState<'schedule' | 'tournaments'>('schedule');

  const channelId = getIdByNetwork(channel.name);

  return (
    <>
      <section className="about-section">
        <p>{channel.description}</p>
        {!inWalletBrowser && (
          <div className="video-container">
            {!videoError ? (
              <video
                autoPlay
                loop
                muted
                playsInline
                onError={() => setVideoError(true)}
              >
                <source src={channel.demo_video_url} type="video/mp4" />
              </video>
            ) : (
              <div className="video-loading">
                <span>Video unavailable</span>
              </div>
            )}
          </div>
        )}
      </section>

      <div className="tab-buttons">
        <button
          className={`tab-button ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          Schedule
        </button>
        <button
          className={`tab-button ${activeTab === 'tournaments' ? 'active' : ''}`}
          onClick={() => setActiveTab('tournaments')}
        >
          Tournaments
        </button>
      </div>

      {activeTab === 'schedule' && (
        <EpisodeSchedule channelId={channelId} onError={onError} />
      )}

      {activeTab === 'tournaments' && (
        <TournamentManager />
      )}
    </>
  );
}
