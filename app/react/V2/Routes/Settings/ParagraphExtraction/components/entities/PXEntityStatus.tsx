import { Pill } from 'app/V2/Components/UI';
import React from 'react';
import { Translate } from 'app/I18N';
import { EntityStatus } from 'V2/shared/ParagraphExtractionTypes';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

const entityStatusMap: Record<EntityStatus, React.ReactNode> = {
  [EntityStatus.New]: (
    <Pill color="indigo">
      <Translate>New</Translate>
    </Pill>
  ),
  [EntityStatus.Processing]: (
    <Pill color="gray">
      <Translate>Processing</Translate>...
    </Pill>
  ),
  [EntityStatus.Processed]: (
    <span>
      <CheckCircleIcon className="w-6 text-success-700" />
      <Translate className="sr-only">Processed</Translate>
    </span>
  ),
  [EntityStatus.Error]: (
    <Pill color="red">
      <Translate>Error</Translate>
    </Pill>
  ),
  [EntityStatus.Obsolete]: (
    <Pill color="blue">
      <Translate>Obsolete</Translate>
    </Pill>
  ),
};

const PXEntityStatus = ({ status }: { status: EntityStatus }) => {
  const component = entityStatusMap[status] ?? <Pill color="gray">{status}</Pill>;
  return <div>{component}</div>;
};

export { PXEntityStatus };
