import { truncateAddress } from '../utils/formatting';
import { CopyableText } from './CopyableText';

interface TokenDisplayProps {
  image: string;
  symbol: string;
  tokenAddress?: string;
}

export function TokenDisplay({ image, symbol, tokenAddress }: TokenDisplayProps) {
  return (
    <div className="flex gap-lg">
      <img src={image} alt={symbol} className="object-contain rounded-full w-[40px] h-[40px]" />
      <div className="flex flex-col">
        <span className="title">{symbol}</span>
        {tokenAddress && (
          <CopyableText
            text={tokenAddress}
            displayText={truncateAddress(tokenAddress)}
          />
        )}
      </div>
    </div>
  );
}
