import React from 'react';
import { BeaconShell } from './BeaconShell.js';
import { LegacyBeaconButtonContent } from './LegacyBeaconButtonContent.js';
import { useBeaconDisplay } from './useBeaconDisplay.js';
import type { LegacyBeaconProps } from './beaconTypes.js';

const LegacyBeacon = ({
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
  chromeForeground,
  chromeFadeColor,
  chromeFadeStartColor,
}: LegacyBeaconProps) => {
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

  return (
    <BeaconShell
      overallStatus={overallStatus}
      isConnected={isConnected}
      hasRunningTasks={hasRunningTasks}
      isPanelOpen={isPanelOpen}
      onClick={onClick}
      controlsId={controlsId}
      popKey={popKey}
      anchorStyle={
        {
          ['--beacon-header-fade' as string]: chromeFadeColor,
          ['--beacon-header-fade-start' as string]: chromeFadeStartColor,
        } as React.CSSProperties
      }
      boxStyle={{
        width: 'max-content',
        minWidth: collapsedWidth,
        maxWidth: showVeil ? widthCap : collapsedWidth,
        transitionProperty: 'max-width, box-shadow',
        transitionDuration: '0.42s',
      }}
      pillClassName=""
      buttonClassName="bg-transparent hover:bg-transparent"
      leftVeil={
        showChrome ? (
          <div
            aria-hidden
            className="beacon-header-veil pointer-events-none absolute inset-e-full top-1/2 -translate-y-1/2"
          />
        ) : undefined
      }
      buttonFade={
        showChrome ? (
          <div
            aria-hidden
            className="beacon-header-fade-rail pointer-events-none absolute inset-0 z-0 rtl:scale-x-[-1]"
          />
        ) : undefined
      }
      shellClassName="beacon-legacy"
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...hoverHandlers}
    >
      <LegacyBeaconButtonContent
        chromeForeground={chromeForeground}
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

export { LegacyBeacon };
