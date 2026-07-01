import React, { useState } from 'react';
import type { OverallStatus, StatusNotification, StatusTask } from '#V2/atoms/requestStatusAtom.js';
import { useIsMobile } from '#V2/CustomHooks/useIsMobile.js';
import { BeaconButtonContent } from './BeaconButtonContent.js';
import { buildAriaLabel, deriveBeaconDisplay, type FlashState } from './beaconHelpers.js';
import { DisconnectWarning } from './DisconnectWarning.js';

interface BeaconProps {
  overallStatus: OverallStatus;
  isConnected: boolean;
  hasRunningTasks: boolean;
  isLoading: boolean;
  isPanelOpen: boolean;
  tasks: StatusTask[];
  notifications: StatusNotification[];
  flash: FlashState | null;
  popKey?: number;
  onClick: () => void;
  controlsId: string;
}

const COLLAPSED_WIDTH = '1.75rem';
const EXPANDED_WIDTH = '15rem';
const FLASH_WIDTH = '17rem';

const PILL_BG_WARM = 'var(--color-theme-surface-warm, var(--color-theme-bg-warm, #f9fafb))';
const PILL_BG_VELLUM = 'var(--color-theme-surface-muted, var(--color-theme-bg-muted, #f3f4f6))';

const Beacon = ({
  overallStatus,
  isConnected,
  hasRunningTasks,
  isLoading,
  isPanelOpen,
  tasks,
  notifications,
  flash,
  popKey,
  onClick,
  controlsId,
}: BeaconProps) => {
  const isMobile = useIsMobile();
  const canExpand = isMobile !== true;
  const [hovered, setHovered] = useState(false);

  const display = deriveBeaconDisplay(tasks, notifications, flash, {
    canExpand,
    isPanelOpen,
    hovered,
    isLoading,
    overallStatus,
    hasRunningTasks,
  });

  const showVeil = display.isExpanded || display.showFlash;
  const widthCap = canExpand && display.showFlash ? FLASH_WIDTH : EXPANDED_WIDTH;
  const pillBg = isPanelOpen ? PILL_BG_VELLUM : PILL_BG_WARM;
  const pillSurface = isPanelOpen ? 'bg-vellum' : 'bg-warm';
  const boxStyle: React.CSSProperties = {
    width: 'max-content',
    minWidth: COLLAPSED_WIDTH,
    maxWidth: showVeil ? widthCap : COLLAPSED_WIDTH,
    transitionProperty: 'max-width, box-shadow',
    transitionDuration: '0.42s',
    ['--beacon-pill-bg' as string]: pillBg,
  };

  const buttonClassName = [
    'relative z-10 flex h-7 w-full items-center px-2.5 transition-colors',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300',
    display.buttonSurface,
  ].join(' ');

  return (
    <div dir="ltr" className="relative flex shrink-0 items-center gap-1.5">
      {!isConnected && <DisconnectWarning tooltipId="disconnect-tooltip" />}

      <div className="relative h-7 w-7 shrink-0">
        <div
          className="absolute inset-e-0 top-1/2 z-50 -translate-y-1/2"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {showVeil && (
            <div
              aria-hidden
              className="beacon-collision-veil pointer-events-none absolute inset-e-full top-1/2 h-13 w-22 -translate-y-1/2"
            />
          )}
          <div
            className={`relative rounded-md beacon-spring ${
              showVeil ? '' : pillSurface
            } ${popKey ? 'animate-beacon-pop' : ''}`}
            style={boxStyle}
          >
            {showVeil && (
              <div
                aria-hidden
                className="beacon-chrome-backing pointer-events-none absolute inset-e-0 top-1/2 z-0 w-full -translate-y-1/2"
              />
            )}
            <div className="relative z-10 overflow-hidden rounded-[inherit]">
              <button
                type="button"
                data-testid="status-dot"
                onClick={onClick}
                aria-label={buildAriaLabel(overallStatus, isConnected, hasRunningTasks)}
                aria-controls={controlsId}
                aria-expanded={isPanelOpen}
                className={buttonClassName}
              >
                <BeaconButtonContent
                  showFlash={display.showFlash}
                  flash={flash}
                  isExpanded={display.isExpanded}
                  hasActivity={display.hasActivity}
                  activityLabel={display.activityLabel}
                  taskProgress={display.taskProgress}
                  latest={display.latest}
                  moreCount={display.moreCount}
                  markColor={display.markColor}
                  isBusy={display.isBusy}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export type { BeaconProps, FlashState };
export { Beacon };
