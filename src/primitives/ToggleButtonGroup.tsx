import { useState, useEffect } from 'react';
import './ToggleButtonGroup.css';

export interface ToggleButton {
  id: string;
  label: string;
  disabled?: boolean;
}

interface ToggleButtonGroupProps {
  buttons: ToggleButton[];
  onSelectionChange: (id: string) => void;
  defaultSelected?: string;
}

export function ToggleButtonGroup({
  buttons,
  onSelectionChange,
  defaultSelected,
}: ToggleButtonGroupProps) {
  const firstButtonId = buttons[0]?.id || '';
  const [selectedId, setSelectedId] = useState(defaultSelected || firstButtonId);

  useEffect(() => {
    onSelectionChange(selectedId);
  }, [selectedId, onSelectionChange]);

  const handleClick = (id: string) => {
    const button = buttons.find(b => b.id === id);
    if (!button?.disabled) {
      setSelectedId(id);
    }
  };

  return (
    <div className="toggle-button-group">
      {buttons.map(button => (
        <button
          key={button.id}
          className={`toggle-btn ${selectedId === button.id ? 'active' : ''}`}
          disabled={button.disabled}
          onClick={() => handleClick(button.id)}
        >
          {button.label}
        </button>
      ))}
    </div>
  );
}
