import { useState } from 'react';
import { useIsInAppWalletBrowser } from '@/utils/deviceChecker';
import EpisodeSchedule from '@/features/Episodes/EpisodeSchedule';
import TournamentManager from '@/features/Tournament/TournamentManager';
import { ChannelConfig } from '../../types/channel';
import { getIdByNetwork } from '.';
import './ChannelOverview.css';

interface ChannelOverviewProps {
  channel: ChannelConfig;
}

export default function ChannelOverview({ channel }: ChannelOverviewProps) {
  const inWalletBrowser = useIsInAppWalletBrowser();
  const [videoError, setVideoError] = useState(false);
  const [activeTab, setActiveTab] = useState<'schedule' | 'tournaments'>('schedule');

  const channelId = getIdByNetwork(channel.name);

  return (
    <div className='flex flex-col gap-2xl'>
      <section className="bg-yellow rounded-xl p-xl">
        <p className='inverted'>{channel.description}</p>
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

      <div className="flex flex-wrap justify-center gap-xl">
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
        <EpisodeSchedule channelId={channelId} />
      )}

      {activeTab === 'tournaments' && (
        <TournamentManager />
      )}
      
    </div>
  );
}
