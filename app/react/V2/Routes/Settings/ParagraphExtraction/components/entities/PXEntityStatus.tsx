import React from 'react';
import { Pill } from '#V2/Components/UI/index.js';
import { Translate } from '#app/I18N/index.js';
import { EntityStatus } from '#V2/shared/ParagraphExtractionTypes.js';
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
