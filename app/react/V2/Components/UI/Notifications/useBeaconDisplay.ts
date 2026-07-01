import { useState } from 'react';
import { useIsMobile } from '#V2/CustomHooks/useIsMobile.js';
import {
  COLLAPSED_WIDTH,
  EXPANDED_WIDTH,
  FLASH_WIDTH,
} from './beaconConstants.js';
import { deriveBeaconDisplay } from './beaconHelpers.js';
import type { BaseBeaconProps } from './beaconTypes.js';

const useBeaconDisplay = ({
  tasks,
  notifications,
  flash,
  isPanelOpen,
  isLoading,
  overallStatus,
  hasRunningTasks,
}: BaseBeaconProps) => {
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

  return {
    display,
    showVeil,
    widthCap,
    collapsedWidth: COLLAPSED_WIDTH,
    hoverHandlers: {
      onMouseEnter: () => setHovered(true),
      onMouseLeave: () => setHovered(false),
    },
  };
};

export { useBeaconDisplay };
