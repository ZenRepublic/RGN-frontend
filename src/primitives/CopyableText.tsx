import { useState } from 'react';

interface CopyableTextProps {
  text: string;
  displayText?: string;
  className?: string;
}

export function CopyableText({ text, displayText, className = '' }: CopyableTextProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <span
      className={`copyable-text ${className}`}
      title="Click to copy"
      onClick={handleCopy}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleCopy()}
    >
      {copied ? 'Copied!' : displayText || text}
    </span>
  );
}
