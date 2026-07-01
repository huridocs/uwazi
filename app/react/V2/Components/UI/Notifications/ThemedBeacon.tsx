import React from 'react';
import { BeaconButtonContent } from './BeaconButtonContent.js';
import { BeaconShell } from './BeaconShell.js';
import { PILL_BG_VELLUM, PILL_BG_WARM } from './beaconConstants.js';
import { useBeaconDisplay } from './useBeaconDisplay.js';
import type { ThemedBeaconProps } from './beaconTypes.js';

const ThemedBeacon = ({
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
}: ThemedBeaconProps) => {
  const { display, showVeil, widthCap, collapsedWidth, hoverHandlers } = useBeaconDisplay({
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
  });

  const showChrome = showVeil;
  const pillBg = isPanelOpen ? PILL_BG_VELLUM : PILL_BG_WARM;
  const pillClassName = showChrome ? '' : isPanelOpen ? 'bg-vellum' : 'bg-warm';

  return (
    <BeaconShell
      overallStatus={overallStatus}
      isConnected={isConnected}
      hasRunningTasks={hasRunningTasks}
      isPanelOpen={isPanelOpen}
      onClick={onClick}
      controlsId={controlsId}
      popKey={popKey}
      boxStyle={{
        width: 'max-content',
        minWidth: collapsedWidth,
        maxWidth: showVeil ? widthCap : collapsedWidth,
        transitionProperty: 'max-width, box-shadow',
        transitionDuration: '0.42s',
        ['--beacon-pill-bg' as string]: pillBg,
      }}
      pillClassName={pillClassName}
      buttonClassName={display.themedButtonSurface}
      leftVeil={
        showChrome ? (
          <div
            aria-hidden
            className="beacon-collision-veil pointer-events-none absolute inset-e-full top-1/2 h-13 w-22 -translate-y-1/2"
          />
        ) : undefined
      }
      pillBacking={
        showChrome ? (
          <div
            aria-hidden
            className="beacon-chrome-backing pointer-events-none absolute inset-e-0 top-1/2 z-0 w-full -translate-y-1/2"
          />
        ) : undefined
      }
      {...hoverHandlers}
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
    </BeaconShell>
  );
};

export { ThemedBeacon };
