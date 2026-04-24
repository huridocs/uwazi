import React from 'react';
import { ArrowPathIcon, LinkSlashIcon } from '@heroicons/react/24/outline';
import type { OverallStatus } from '#V2/atoms/requestStatusAtom.js';
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

const dotColorMap: Record<Exclude<OverallStatus, 'loading'>, string> = {
  success: 'bg-green-500',
  warning: 'bg-yellow-400',
  error: 'bg-pink-500',
};

// Injected directly so the animation always works regardless of Tailwind JIT cache state.
const DOT_KEYFRAMES = `
  @keyframes dotPulse {
    0%, 55%, 100% { transform: scale(1); }
    27%           { transform: scale(1.5); }
  }
  @keyframes dotSpreadLeft {
    from { transform: translateX(6px); opacity: 0; }
    to   { transform: translateX(0);   opacity: 1; }
  }
  @keyframes dotSpreadRight {
    from { transform: translateX(-6px); opacity: 0; }
    to   { transform: translateX(0);    opacity: 1; }
  }
  @keyframes dotPop {
    0%   { transform: scale(1); }
    40%  { transform: scale(1.65); }
    70%  { transform: scale(0.9); }
    100% { transform: scale(1); }
  }
`;

const DOT_SIZE = 'w-2 h-2';

const LoadingDots = ({ color }: { color: string }) => (
  <span className="flex items-center gap-1" aria-hidden="true">
    <span style={{ animation: 'dotSpreadLeft 0.25s ease-out forwards' }}>
      <span
        className={`block ${DOT_SIZE} rounded-full`}
        style={{
          backgroundColor: color,
          animation: 'dotPulse 1.8s ease-in-out 0ms infinite backwards',
        }}
      />
    </span>
    <span
      className={`block ${DOT_SIZE} rounded-full`}
      style={{
        backgroundColor: color,
        animation: 'dotPulse 1.8s ease-in-out 300ms infinite backwards',
      }}
    />
    <span style={{ animation: 'dotSpreadRight 0.25s ease-out forwards' }}>
      <span
        className={`block ${DOT_SIZE} rounded-full`}
        style={{
          backgroundColor: color,
          animation: 'dotPulse 1.8s ease-in-out 600ms infinite backwards',
        }}
      />
    </span>
  </span>
);

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
}: StatusDotProps) => (
  <>
    {/* eslint-disable-next-line react/no-danger */}
    <style dangerouslySetInnerHTML={{ __html: DOT_KEYFRAMES }} />
    <div className="flex items-center gap-1.5">
      {!isConnected && <DisconnectWarning color={color} tooltipId="disconnect-tooltip" />}

      <button
        type="button"
        onClick={onClick}
        aria-label={buildAriaLabel(overallStatus, isConnected, hasRunningTasks)}
        aria-controls={controlsId}
        aria-expanded={isExpanded}
        data-testid="status-dot"
        className="flex items-center gap-1.5 p-1 rounded-full cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-300"
      >
        {overallStatus === 'loading' ? (
          <LoadingDots color={color} />
        ) : (
          <span
            key={popKey}
            className={`block w-3 h-3 rounded-full ${dotColorMap[overallStatus]}`}
            style={popKey ? { animation: 'dotPop 0.45s ease-out forwards' } : undefined}
            aria-hidden="true"
          />
        )}

        {hasRunningTasks && (
          <ArrowPathIcon className="w-4 h-4 animate-spin" style={{ color }} aria-hidden="true" />
        )}
      </button>
    </div>
  </>
);

export type { StatusDotProps };
export { StatusDot };
