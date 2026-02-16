import { useState, useCallback } from 'react';
import { SpeedInsights } from "@vercel/speed-insights/react"
import { Header } from '@/components/Header';
import { MenuStack } from '@/components/MenuStack';
import { Footer } from '@/components/Footer';
import { ToggleButtonGroup } from '@/primitives';
import { CHANNELS } from './features/channels';
import ChannelOverview from './features/channels/ChannelOverview';
import './App.css';

function App() {
  const [activeChannelName, setActiveChannelName] = useState(CHANNELS[0]?.name || '');
  const activeChannel = CHANNELS.find(s => s.name === activeChannelName);

  const handleChannelChange = useCallback((channelId: string) => {
    setActiveChannelName(channelId);
  }, []);

  return (
    <div>
      <Header />

      <div className="hero-section">
        <img src="/Branding/BannerWithLogo.png" alt="RGN Banner" className="banner" />
        <MenuStack />
        <h1>Unleash The Brainrot!</h1>
        <p>RGN is the world's first  <span className="highlight">onchain brainrot</span> broadcast network. <br /><br /> Select one of available channels, drop your favorite characters in and watch them compete for eternal glory on Solana!</p>
      </div>


      <ToggleButtonGroup
        buttons={[
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
        ]}
        onSelectionChange={handleChannelChange}
        defaultSelected={CHANNELS[0]?.name}
      />

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
