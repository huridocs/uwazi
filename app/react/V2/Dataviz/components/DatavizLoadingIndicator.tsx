import React from 'react';
import { UwaziLoader } from '#V2/Components/UI/UwaziLoader.js';

type DatavizLoadingIndicatorProps = {
  label?: string;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
  centered?: boolean;
};

const DatavizLoadingIndicator = ({
  label,
  size = 'sm',
  className = '',
  centered = false,
}: DatavizLoadingIndicatorProps) => (
  <div
    className={`flex items-center gap-2 ${centered ? 'min-h-48 w-full justify-center' : ''} ${className}`.trim()}
    aria-busy="true"
  >
    <UwaziLoader size={size} color="carbon" />
    {label ? <span className="text-sm text-ink-secondary">{label}</span> : null}
  </div>
);

export { DatavizLoadingIndicator };
