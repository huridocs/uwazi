import React from 'react';
import type { Entity } from '#V2/api/entities/types.js';
import type { DocumentFieldMutations } from '../editEntityTypes.js';
import { AdditionalFilesField } from './AdditionalFilesField.js';
import { DocumentField } from './DocumentField.js';

type EntityFileFieldsProps = {
  entity?: Entity;
  disabled?: boolean;
  mutations?: DocumentFieldMutations;
};

const EntityFileFields = ({ entity, disabled = false, mutations }: EntityFileFieldsProps) => {
  if (!mutations) {
    return null;
  }

  return (
    <>
      <DocumentField entity={entity} disabled={disabled} mutations={mutations} />
      <AdditionalFilesField entity={entity} disabled={disabled} mutations={mutations} />
    </>
  );
};

export { EntityFileFields };
