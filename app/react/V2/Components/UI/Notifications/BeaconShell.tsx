import React from 'react';
import type { OverallStatus } from '#V2/atoms/requestStatusAtom.js';
import { buildAriaLabel } from './beaconHelpers.js';
import { BEACON_BUTTON_BASE } from './beaconConstants.js';
import { DisconnectWarning } from './DisconnectWarning.js';

interface BeaconShellProps {
  overallStatus: OverallStatus;
  isConnected: boolean;
  hasRunningTasks: boolean;
  isPanelOpen: boolean;
  onClick: () => void;
  controlsId: string;
  popKey?: number;
  boxStyle: React.CSSProperties;
  pillClassName: string;
  buttonClassName: string;
  anchorStyle?: React.CSSProperties;
  leftVeil?: React.ReactNode;
  pillBacking?: React.ReactNode;
  buttonFade?: React.ReactNode;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  shellClassName?: string;
  children: React.ReactNode;
}

const BeaconShell = ({
  overallStatus,
  isConnected,
  hasRunningTasks,
  isPanelOpen,
  onClick,
  controlsId,
  popKey,
  boxStyle,
  pillClassName,
  buttonClassName,
  anchorStyle,
  leftVeil,
  pillBacking,
  buttonFade,
  onMouseEnter,
  onMouseLeave,
  shellClassName,
  children,
}: BeaconShellProps) => (
  <div dir="ltr" className={`relative flex shrink-0 items-center gap-1.5 ${shellClassName ?? ''}`}>
    {!isConnected && <DisconnectWarning tooltipId="disconnect-tooltip" />}

    <div className="relative h-7 w-7 shrink-0">
      <div
        className="absolute inset-e-0 top-1/2 z-50 h-7 -translate-y-1/2"
        style={anchorStyle}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {leftVeil}
        <div
          className={`relative rounded-md beacon-spring ${pillClassName} ${popKey ? 'animate-beacon-pop' : ''}`}
          style={boxStyle}
        >
          {pillBacking}
          <div className="relative z-10 overflow-hidden rounded-[inherit]">
            <button
              type="button"
              data-testid="status-dot"
              onClick={onClick}
              aria-label={buildAriaLabel(overallStatus, isConnected, hasRunningTasks)}
              aria-controls={controlsId}
              aria-expanded={isPanelOpen}
              className={`${BEACON_BUTTON_BASE} ${buttonClassName}`}
            >
              {buttonFade}
              <div className="relative z-10 flex w-full min-w-0 items-center">{children}</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export { BeaconShell };
