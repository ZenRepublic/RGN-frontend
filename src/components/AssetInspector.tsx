import { IS_MAINNET } from '@/config/network';
import './AssetInspector.css';

interface AssetInspectorProps {
  assetAddress: string;
}

export function AssetInspector({ assetAddress }: AssetInspectorProps) {
  const handleClick = () => {
    const url = IS_MAINNET
      ? `https://solscan.io/token/${assetAddress}`
      : `https://solscan.io/token/${assetAddress}?cluster=devnet`;
    window.open(url, '_blank');
  };

  return (
    <button className="asset-inspector-btn" onClick={handleClick} title="View on Solscan">
      <img src="/Logos/solscanlogo.png" alt="Solscan" />
    </button>
  );
}
