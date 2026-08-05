import type { OverallStatus, StatusNotification, StatusTask } from '#V2/atoms/requestStatusAtom.js';
import type { FlashState } from './beaconHelpers.js';

interface BaseBeaconProps {
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

type ThemedBeaconProps = BaseBeaconProps;

interface LegacyBeaconProps extends BaseBeaconProps {
  chromeForeground: string;
  chromeFadeColor: string;
  chromeFadeStartColor: string;
}

export type { BaseBeaconProps, ThemedBeaconProps, LegacyBeaconProps, FlashState };
