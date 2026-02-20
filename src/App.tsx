import { useState, useCallback } from 'react';
import { SpeedInsights } from "@vercel/speed-insights/react"
import { Header } from '@/components/Header';
import { MenuStack } from '@/components/MenuStack';
import { Footer } from '@/components/Footer';
import { CHANNELS } from './features/Channel';
import ChannelOverview from './features/Channel/ChannelOverview';


function App() {
  const [activeChannelName, setActiveChannelName] = useState(CHANNELS[0]?.name || '');
  const activeChannel = CHANNELS.find(s => s.name === activeChannelName);

  const handleChannelChange = useCallback((channelId: string) => {
    setActiveChannelName(channelId);
  }, []);

  const channels = [
    ...CHANNELS.map(channel => ({
      id: channel.name,
      label: channel.name,
      disabled: channel.disabled,
    })),
    {
      id: 'more-soon',
      label: 'More Soon...',
      disabled: true,
    },
  ];

  return (
    <div>
      <Header />

      <img src="/Branding/BannerWithLogo.png" alt="RGN Banner" className="w-full rounded-lg shadow-xl object-cover mx-auto" />
      <MenuStack />
      <h1 className='mb-xl'>Unleash The Brainrot!</h1>
      <p className='mb-lg'>RGN is the world's first  <span className="highlight">onchain brainrot</span> broadcast network.</p>
      <p className='mb-lg'>Select one of available channels, drop your favorite characters in and watch them compete for eternal glory on Solana!</p>

      <div className="flex gap-lg mb-2xl">
        {channels.map(channel => (
          <button
            key={channel.id}
            className={`toggle-btn ${activeChannelName === channel.id ? 'active' : ''}`}
            disabled={channel.disabled}
            onClick={() => handleChannelChange(channel.id)}
          >
            {channel.label}
          </button>
        ))}
      </div>

      {activeChannel && (
        <>
          <ChannelOverview channel={activeChannel} />
        </>
      )}

      <Footer />
      <SpeedInsights />
    </div>
  );
}

export default App;
