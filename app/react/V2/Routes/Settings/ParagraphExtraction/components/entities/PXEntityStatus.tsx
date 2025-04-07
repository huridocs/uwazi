import { Pill } from 'app/V2/Components/UI';
import React from 'react';
import { Icon } from 'app/UI';
import { Translate } from 'app/I18N';
import { EntityStatus } from 'V2/shared/ParagraphExtractionTypes';

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
  [EntityStatus.Processed]: <Icon className="text-green-600" icon="check-circle" />,
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
