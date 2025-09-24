// @ts-expect-error TS(2307): Cannot find module '../../V2/Components/UI.js' or ... Remove this comment to see the full error message
import { Pill } from '../../V2/Components/UI.js';
import React from 'react';
// @ts-expect-error TS(2307): Cannot find module '../../I18N/index.js' or its co... Remove this comment to see the full error message
import { Translate } from '../../I18N/index.js';
import { EntityStatus } from '../../../../../shared/ParagraphExtractionTypes.js';
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
