import React from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { OverallStatus } from '#V2/atoms/requestStatusAtom.js';

interface StatusDotProps {
  overallStatus: OverallStatus;
  isConnected: boolean;
  hasRunningTasks: boolean;
  onClick: () => void;
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
`;

const DOT_SIZE = 'w-2 h-2';

const LoadingDots = () => (
  <>
    {/* eslint-disable-next-line react/no-danger */}
    <style dangerouslySetInnerHTML={{ __html: DOT_KEYFRAMES }} />
    <span className="flex items-center gap-1" aria-hidden="true">
      <span style={{ animation: 'dotSpreadLeft 0.25s ease-out forwards' }}>
        <span
          className={`block ${DOT_SIZE} rounded-full bg-gray-700`}
          style={{ animation: 'dotPulse 1.8s ease-in-out 0ms infinite backwards' }}
        />
      </span>
      <span
        className={`block ${DOT_SIZE} rounded-full bg-gray-700`}
        style={{ animation: 'dotPulse 1.8s ease-in-out 300ms infinite backwards' }}
      />
      <span style={{ animation: 'dotSpreadRight 0.25s ease-out forwards' }}>
        <span
          className={`block ${DOT_SIZE} rounded-full bg-gray-700`}
          style={{ animation: 'dotPulse 1.8s ease-in-out 600ms infinite backwards' }}
        />
      </span>
    </span>
  </>
);

const TOOLTIP_ID = 'disconnect-tooltip';

const DisconnectWarning = () => (
  <span
    className="relative inline-flex group"
    tabIndex={0}
    aria-label="Server disconnected"
    aria-describedby={TOOLTIP_ID}
  >
    <ExclamationTriangleIcon className="w-4 h-4 text-pink-500 cursor-help" aria-hidden="true" />
    <span
      id={TOOLTIP_ID}
      role="tooltip"
      className={[
        'pointer-events-none absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2',
        'whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1.5 text-xs text-white shadow-lg',
        'opacity-0 transition-opacity duration-150',
        'group-hover:opacity-100 group-focus:opacity-100',
      ].join(' ')}
    >
      Cannot connect to server
      <span
        className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"
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

const StatusDot = ({ overallStatus, isConnected, hasRunningTasks, onClick }: StatusDotProps) => (
  <div className="flex items-center gap-1.5">
    {!isConnected && <DisconnectWarning />}

    <button
      type="button"
      onClick={onClick}
      aria-label={buildAriaLabel(overallStatus, isConnected, hasRunningTasks)}
      className="flex items-center gap-1.5 p-1 rounded-full cursor-pointer hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-300"
    >
      {overallStatus === 'loading' ? (
        <LoadingDots />
      ) : (
        <span
          className={`block w-3 h-3 rounded-full ${dotColorMap[overallStatus]}`}
          aria-hidden="true"
        />
      )}

      {hasRunningTasks && (
        <ArrowPathIcon className="w-4 h-4 text-indigo-500 animate-spin" aria-hidden="true" />
      )}
    </button>
  </div>
);

export type { StatusDotProps };
export { StatusDot };
