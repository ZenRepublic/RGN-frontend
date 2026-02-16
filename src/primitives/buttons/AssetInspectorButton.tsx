import { IS_MAINNET } from '@/config/network';
import { ImageButton } from '@/primitives';

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
    <ImageButton
      onClick={handleClick}
      ariaLabel="View on Solscan"
      className="image-button"
    >
      <img src="/Logos/solscanlogo.png" alt="Solscan" />
    </ImageButton>
  );
}
