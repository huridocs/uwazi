import React from 'react';
import { InputField } from '#V2/Components/Forms/InputField.js';
import type { DatavizDefinition } from '#V2/Dataviz/types/definition.js';
import { DatavizInfoPanel } from '../preview/DatavizInfoPanel.js';

type InfoTabProps = {
  definition: DatavizDefinition;
  onChange: (patch: Partial<DatavizDefinition>) => void;
};

const InfoTab = ({ definition, onChange }: InfoTabProps) => (
  <div className="flex flex-col gap-6 p-4">
    <InputField
      id="dataviz-name"
      label="Name"
      value={definition.name}
      onChange={e => onChange({ name: e.target.value })}
    />
    <DatavizInfoPanel definition={definition} />
  </div>
);

export { InfoTab };
