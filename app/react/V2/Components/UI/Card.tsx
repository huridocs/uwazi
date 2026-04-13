import React from 'react';
import { SurfacePanel } from './SurfacePanel.js';

interface CardProps {
  title?: string | React.ReactNode;
  children: React.ReactNode;
  className?: string;
  color?: 'default' | 'yellow' | 'black';
}

const Card = ({ title, children, className, color = 'default' }: CardProps) => {
  let headerStyle: React.CSSProperties;

  switch (color) {
    case 'yellow':
      headerStyle = {
        backgroundColor: 'var(--color-theme-card-header-yellow-bg)',
        color: 'var(--color-theme-card-header-yellow-fg)',
      };
      break;
    case 'black':
      headerStyle = {
        backgroundColor: 'var(--color-theme-card-header-black-bg)',
        color: 'var(--color-theme-card-header-black-fg)',
      };
      break;
    default:
      headerStyle = {
        backgroundColor: 'var(--color-theme-card-header-default-bg)',
        color: 'var(--color-theme-card-header-default-fg)',
      };
  }

  return (
    <SurfacePanel
      className={className}
      padding="none"
      style={{ borderColor: 'var(--color-theme-card-border)' }}
    >
      {title && (
        <div
          className="block w-full border-b p-4 text-base font-semibold"
          style={{
            ...headerStyle,
            borderColor: 'var(--color-theme-card-border)',
          }}
        >
          {title}
        </div>
      )}
      <div className="p-4 h-full w-full overflow-y-auto">{children}</div>
    </SurfacePanel>
  );
};

export { Card };
