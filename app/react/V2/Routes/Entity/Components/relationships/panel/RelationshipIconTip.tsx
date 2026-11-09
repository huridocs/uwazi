import React from 'react';
import { PortalTooltip } from '#V2/Components/UI/index.js';

type RelationshipIconTipProps = {
  label: string;
  className: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
};

const RelationshipIconTip = ({
  label,
  className,
  disabled,
  onClick,
  children,
}: RelationshipIconTipProps) => (
  <PortalTooltip content={label} placement="top">
    <button
      type="button"
      aria-label={label}
      className={className}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  </PortalTooltip>
);

export { RelationshipIconTip };
