/* eslint-disable react/no-multi-comp */
import React from 'react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid';
import type { NotificationType, StatusNotification } from '#V2/atoms/requestStatusAtom.js';
import { UwaziLoader, type UwaziLoaderColor } from '#V2/Components/UI/UwaziLoader.js';
import { BeaconRailLabel } from './BeaconRailLabel.js';
import type { FlashState } from './beaconHelpers.js';

const suffixClass = 'shrink-0 text-[11px] font-semibold tabular-nums';

const legacyIconColor: Record<NotificationType, string> = {
  success: 'var(--color-theme-success, #059669)',
  warning: 'var(--color-theme-warning, #d97706)',
  error: 'var(--color-theme-accent-emphasis, #e8432a)',
  info: 'var(--color-theme-accent-supporting, #00b4f0)',
};

const LegacyNotificationKindIcon = ({ type }: { type: NotificationType }) => {
  const icons = {
    success: CheckCircleIcon,
    warning: ExclamationTriangleIcon,
    error: XCircleIcon,
    info: InformationCircleIcon,
  } as const;
  const Icon = icons[type];
  return (
    <Icon
      className="notification-kind-icon notification-kind-icon--solid h-3.5 w-3.5 shrink-0"
      style={{ color: legacyIconColor[type] }}
    />
  );
};

interface LegacyBeaconButtonContentProps {
  chromeForeground: string;
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

const LegacyBeaconButtonContent = ({
  chromeForeground,
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
}: LegacyBeaconButtonContentProps) => {
  const railTextStyle = { color: chromeForeground };
  const suffixStyle = { color: chromeForeground, opacity: 0.72 };

  if (showFlash && flash) {
    return (
      <div
        key="flash"
        data-testid="notification-flash"
        className="animate-beacon-rail flex w-full min-w-0 items-center gap-2"
      >
        <LegacyNotificationKindIcon type={flash.type} />
        <span
          data-testid="notification-flash-title"
          title={flash.title}
          className="min-w-0 flex-1 truncate text-[12px] font-medium"
          style={railTextStyle}
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
          foreground={chromeForeground}
          suffix={
            taskProgress !== null ? (
              <span className={suffixClass} style={suffixStyle}>
                {taskProgress}%
              </span>
            ) : undefined
          }
        />
      </div>
    );
  }

  if (isExpanded && latest) {
    return (
      <div key="summary" className="animate-beacon-rail flex w-full min-w-0 items-center gap-2">
        <LegacyNotificationKindIcon type={latest.type} />
        <BeaconRailLabel
          text={latest.title}
          foreground={chromeForeground}
          suffix={
            moreCount > 0 ? (
              <span className={suffixClass} style={suffixStyle}>
                +{moreCount}
              </span>
            ) : undefined
          }
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

export { LegacyBeaconButtonContent };
