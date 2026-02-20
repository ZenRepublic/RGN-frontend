import { useMemo } from 'react';
import './SparkleEffect.css';

interface SparkleEffectProps {
  count?: number;
}

export function SparkleEffect({ count = 20 }: SparkleEffectProps) {
  const sparkles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 3}s`,
        animationDuration: `${2 + Math.random() * 2}s`,
      })),
    [count],
  );

  return (
    <div className="sparkles">
      {sparkles.map(({ id, ...style }) => (
        <div key={id} className="sparkle" style={style} />
      ))}
    </div>
  );
}
