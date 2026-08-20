import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { InputField } from '#V2/Components/Forms/InputField.js';
import type { DatavizDefinition } from '#V2/Dataviz/types/definition.js';
import { DatavizInfoPanel } from '../preview/DatavizInfoPanel.js';

type InfoTabProps = {
  definition: DatavizDefinition;
  nameError?: boolean;
  onChange: (patch: Partial<DatavizDefinition>) => void;
};

const InfoTab = ({ definition, nameError = false, onChange }: InfoTabProps) => (
  <div className="flex flex-col gap-6 p-4">
    <InputField
      id="dataviz-name"
      label="Name"
      value={definition.name}
      hasErrors={nameError}
      errorMessage={
        nameError ? (
          <Translate>This data visualization name already exists. Enter a unique name.</Translate>
        ) : (
          ''
        )
      }
      onChange={e => onChange({ name: e.target.value })}
    />
    <DatavizInfoPanel definition={definition} onChange={onChange} />
  </div>
);

export { InfoTab };
