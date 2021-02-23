import React from 'react';
import { Translate } from 'app/I18N';
import { Icon } from 'UI';

export interface EntityCounterProps {
  selectedEntitiesCount: number;
  entityListCount: number;
  entityTotal: number;
  totalConnectionsCount: number;
  hiddenConnectionsCount: number;
}

export const DocumentCounter = (props: EntityCounterProps) => {
  const {
    totalConnectionsCount,
    hiddenConnectionsCount,
    selectedEntitiesCount,
    entityListCount,
    entityTotal,
  } = props;

  const entityCounter = (
    <>
      {selectedEntitiesCount > 0 && (
        <>
          <b> {selectedEntitiesCount} </b> <Translate>selected of</Translate>
        </>
      )}
      <b> {entityListCount} </b> <Translate>shown of</Translate>
      <b> {entityTotal} </b> <Translate>documents</Translate>
    </>
  );

  const connectionsCounter = (
    <>
      <b>{totalConnectionsCount - hiddenConnectionsCount} </b>
      <Translate>connections</Translate>
      {hiddenConnectionsCount > 0 && (
        <>
          {' ('}
          <div className="hidden-connections-counter">
            {`${hiddenConnectionsCount} `}
            <Translate>hidden</Translate> <Icon icon="info-circle-hollow" />
            <span className="hidden-info">
              You don’t have rights to see these entities. To see them, someone from the
              organization has to share them with you.
            </span>
          </div>
          )
        </>
      )}
      , <b>{entityTotal} </b>
      <Translate>documents</Translate>
    </>
  );

  return <span>{totalConnectionsCount === undefined ? entityCounter : connectionsCounter}</span>;
};
