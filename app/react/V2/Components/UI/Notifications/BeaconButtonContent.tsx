import React from 'react';
import type { StatusNotification } from '#V2/atoms/requestStatusAtom.js';
import { UwaziLoader, type UwaziLoaderColor } from '#V2/Components/UI/UwaziLoader.js';
import { BeaconRailLabel } from './BeaconRailLabel.js';
import type { FlashState } from './beaconHelpers.js';
import { NotificationKindIcon } from './notificationKindIcons.js';

const suffixClass = 'shrink-0 text-[11px] font-semibold text-ink-tertiary tabular-nums';

interface BeaconButtonContentProps {
  showFlash: boolean;
  flash: FlashState | null;
  isExpanded: boolean;
  hasActivity: boolean;
  activityLabel: string;
  taskProgress: number | null;
  latest: StatusNotification | undefined;
  moreCount: number;
  markColor: UwaziLoaderColor;
  isBusy: boolean;
}

const BeaconButtonContent = ({
  showFlash,
  flash,
  isExpanded,
  hasActivity,
  activityLabel,
  taskProgress,
  latest,
  moreCount,
  markColor,
  isBusy,
}: BeaconButtonContentProps) => {
  if (showFlash && flash) {
    return (
      <div
        key="flash"
        data-testid="notification-flash"
        className="animate-beacon-rail flex w-full min-w-0 items-center gap-2"
      >
        <NotificationKindIcon type={flash.type} size="beacon" />
        <span
          data-testid="notification-flash-title"
          title={flash.title}
          className="min-w-0 flex-1 truncate text-[12px] font-medium text-ink"
        >
          {flash.title}
        </span>
      </div>
    );
  }

  if (isExpanded && hasActivity) {
    return (
      <div key="live" className="animate-beacon-rail flex w-full min-w-0 items-center gap-2">
        <span className="flex shrink-0 items-center">
          <UwaziLoader size="xs" color="carbon" animate />
        </span>
        <BeaconRailLabel
          text={activityLabel}
          suffix={
            taskProgress !== null ? <span className={suffixClass}>{taskProgress}%</span> : undefined
          }
        />
      </div>
    );
  }

  if (isExpanded && latest) {
    return (
      <div key="summary" className="animate-beacon-rail flex w-full min-w-0 items-center gap-2">
        <NotificationKindIcon type={latest.type} size="beacon" />
        <BeaconRailLabel
          text={latest.title}
          suffix={moreCount > 0 ? <span className={suffixClass}>+{moreCount}</span> : undefined}
        />
      </div>
    );
  }

  return (
    <div key="idle" className="flex w-full items-center justify-center">
      <UwaziLoader size="xs" color={markColor} animate={isBusy} />
    </div>
  );
};

export { BeaconButtonContent };
