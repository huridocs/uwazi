import { Pill } from 'app/V2/Components/UI';
import React from 'react';
import { Icon } from 'app/UI';
import { Translate } from 'app/I18N';
import { EntityStatus } from '../types';

const entityStatusMap: Record<EntityStatus, React.ReactNode> = {
  NEW: (
    <Pill color="indigo">
      <Translate>New</Translate>
    </Pill>
  ),
  IN_QUEUE: (
    <Pill color="gray">
      <Translate>In queue</Translate>
    </Pill>
  ),
  PROCESSING: (
    <Pill color="gray">
      <Translate>Processing</Translate>...
    </Pill>
  ),
  DONE: <Icon className="text-green-600" icon="check-circle" />,
  HAS_ERROR: (
    <Pill color="red">
      <Translate>Error</Translate>
    </Pill>
  ),
};

const PXEntityStatus = ({ status }: { status: EntityStatus }) => {
  const component = entityStatusMap[status] ?? <Pill color="gray">{status}</Pill>;
  return <div>{component}</div>;
};

export { PXEntityStatus };
