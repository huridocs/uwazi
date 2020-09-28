import { Translate } from 'app/I18N';
import React from 'react';

interface EntityCounterProps {
  selectedEntitiesCount: number;
  entityListCount: number;
  entityTotal: number;
  totalConnectionsCount: number;
}

export const DocumentCounter = (props: EntityCounterProps) => {
  const { totalConnectionsCount, selectedEntitiesCount, entityListCount, entityTotal } = props;
  const counter =
    totalConnectionsCount === undefined ? (
      <>
        {selectedEntitiesCount > 0 && (
          <>
            <b> {selectedEntitiesCount} </b> <Translate>selected of</Translate>
          </>
        )}
        <b> {entityListCount} </b> <Translate>shown of</Translate>
        <b> {entityTotal} </b> <Translate>documents</Translate>
      </>
    ) : (
      <>
        <b>{totalConnectionsCount} </b>
        <Translate>connections</Translate>, <b>{entityTotal} </b>
        {<Translate>documents</Translate>}
      </>
    );

  return <span>{counter}</span>;
};
