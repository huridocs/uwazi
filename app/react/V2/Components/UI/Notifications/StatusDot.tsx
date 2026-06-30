import React from 'react';
import { LinkSlashIcon } from '@heroicons/react/24/outline';
import type { OverallStatus } from '#V2/atoms/requestStatusAtom.js';
import { UwaziLoader, type UwaziLoaderColor } from '#V2/Components/UI/UwaziLoader.js';
import { Translate } from '#app/I18N/index.js';

interface StatusDotProps {
  overallStatus: OverallStatus;
  isConnected: boolean;
  hasRunningTasks: boolean;
  onClick: () => void;
  popKey?: number;
  color?: string;
  controlsId?: string;
  isExpanded?: boolean;
}

const POP_KEYFRAMES = `
  @keyframes dotPop {
    0%   { transform: scale(1); }
    40%  { transform: scale(1.65); }
    70%  { transform: scale(0.9); }
    100% { transform: scale(1); }
  }
`;

const statusColor: Record<OverallStatus, UwaziLoaderColor> = {
  loading: 'carbon',
  error: 'seal',
  warning: 'warning',
  success: 'default',
};

const DisconnectWarning = ({ color, tooltipId }: { color: string; tooltipId: string }) => (
  <span className="relative inline-flex group">
    <button
      type="button"
      className="inline-flex items-center rounded-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
      aria-label="Server disconnected"
      aria-describedby={tooltipId}
    >
      <LinkSlashIcon className="w-4 h-4 cursor-help" style={{ color }} aria-hidden="true" />
    </button>
    <span
      id={tooltipId}
      role="tooltip"
      className={[
        'pointer-events-none absolute z-50 top-full left-1/2 -translate-x-1/2 mt-2',
        'whitespace-nowrap rounded-md bg-white border border-gray-200 px-2.5 py-1.5 text-xs text-gray-700 shadow-md',
        'opacity-0 transition-opacity duration-150',
        'group-hover:opacity-100 group-focus-within:opacity-100',
      ].join(' ')}
    >
      <Translate>Cannot connect to server</Translate>
      <span
        className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-200"
        aria-hidden="true"
      />
    </span>
  </span>
);

const buildAriaLabel = (
  overallStatus: OverallStatus,
  isConnected: boolean,
  hasRunningTasks: boolean
): string => {
  const parts = [`Status: ${overallStatus}`];
  if (!isConnected) parts.push('server disconnected');
  if (hasRunningTasks) parts.push('tasks running');
  return `Notifications — ${parts.join(', ')}`;
};

const StatusDot = ({
  overallStatus,
  isConnected,
  hasRunningTasks,
  onClick,
  popKey,
  color = 'black',
  controlsId,
  isExpanded,
}: StatusDotProps) => {
  const isBusy = overallStatus === 'loading' || hasRunningTasks;
  const markColor = isBusy ? 'carbon' : statusColor[overallStatus];

  return (
    <>
      {/* eslint-disable-next-line react/no-danger */}
      <style dangerouslySetInnerHTML={{ __html: POP_KEYFRAMES }} />
      <div className="flex items-center gap-1.5">
        {!isConnected && <DisconnectWarning color={color} tooltipId="disconnect-tooltip" />}

        <button
          type="button"
          onClick={onClick}
          aria-label={buildAriaLabel(overallStatus, isConnected, hasRunningTasks)}
          aria-controls={controlsId}
          aria-expanded={isExpanded}
          data-testid="status-dot"
          className="flex items-center justify-center p-1.5 rounded-md cursor-pointer transition-colors hover:bg-warm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          <span
            key={popKey}
            aria-hidden="true"
            style={popKey ? { animation: 'dotPop 0.45s ease-out forwards' } : undefined}
          >
            <UwaziLoader size="xs" color={markColor} animate={isBusy} />
          </span>
        </button>
      </div>
    </>
  );
};

export type { StatusDotProps };
export { StatusDot };
