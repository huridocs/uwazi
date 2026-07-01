import React from 'react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import type { NotificationType } from '#V2/atoms/requestStatusAtom.js';

const kindColor: Record<NotificationType, string> = {
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-emphasis',
  info: 'text-supporting',
};

type NotificationKindIconSize = 'drawer' | 'beacon';

const sizeClass: Record<NotificationKindIconSize, string> = {
  drawer: 'h-[17px] w-[17px]',
  beacon: 'h-3.5 w-3.5',
};

const icons: Record<NotificationType, typeof CheckCircleIcon> = {
  success: CheckCircleIcon,
  warning: ExclamationTriangleIcon,
  error: XCircleIcon,
  info: InformationCircleIcon,
};

const NotificationKindIcon = ({
  type,
  size,
}: {
  type: NotificationType;
  size: NotificationKindIconSize;
}) => {
  const Icon = icons[type];
  return (
    <Icon className={`notification-kind-icon ${sizeClass[size]} shrink-0 ${kindColor[type]}`} />
  );
};

export { NotificationKindIcon };
