import React from 'react';
// @ts-expect-error TS(2307): Cannot find module '../../I18N/index.js' or its co... Remove this comment to see the full error message
import { Translate } from '../../I18N/index.js';

export interface EntityCounterProps {
  selectedEntitiesCount: number;
  entityListCount: number;
  entityTotal: number;
  totalConnectionsCount?: number;
  hitsTotalRelation: string;
}

export const DocumentCounter = (props: EntityCounterProps) => {
  const {
    totalConnectionsCount,
    selectedEntitiesCount,
    entityListCount,
    entityTotal,
    hitsTotalRelation,
  } = props;
  const totalEntitiesValue = <b> {`${entityTotal}${hitsTotalRelation === 'gte' ? '+' : ''}`} </b>;
  const entityCounter = (
    <>
      {selectedEntitiesCount > 0 && (
        <>
          <b> {selectedEntitiesCount} </b> <Translate>selected of</Translate>
        </>
      )}
      <b> {entityListCount} </b> <Translate>shown of</Translate>
      {totalEntitiesValue}
      <Translate>entities</Translate>
    </>
  );
  const connectionsCounter = (
    <>
      <b>{totalConnectionsCount!} </b>
      <Translate>relationships</Translate>, <b>{totalEntitiesValue} </b>
      <Translate>entities</Translate>
    </>
  );

  return <span>{totalConnectionsCount === undefined ? entityCounter : connectionsCounter}</span>;
};
