import type { ReactNode } from 'react';
import './SectionHeader.css';

interface SectionHeaderProps {
  title: string;
  actions?: [ReactNode?, ReactNode?];
}

export function SectionHeader({ title, actions }: SectionHeaderProps) {
  const [action1, action2] = actions ?? [];

  return (
    <div className="section-header">
      <h2 className="section-header-title">{title}</h2>
      {(action1 || action2) && (
        <div className="section-header-actions">
          {action1}
          {action2}
        </div>
      )}
    </div>
  );
}
