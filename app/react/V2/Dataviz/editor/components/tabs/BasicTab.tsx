import React from 'react';
import { InputField } from '#V2/Components/Forms/InputField.js';
import { Textarea } from '#V2/Components/Forms/Textarea.js';
import type { DatavizDefinition } from '#V2/Dataviz/types/definition.js';

type BasicTabProps = {
  definition: DatavizDefinition;
  onChange: (patch: Partial<DatavizDefinition>) => void;
};

const BasicTab = ({ definition, onChange }: BasicTabProps) => (
  <div className="flex flex-col gap-4 p-4">
    <InputField
      id="dataviz-name"
      label="Name"
      value={definition.name}
      onChange={e => onChange({ name: e.target.value })}
    />
    <Textarea
      id="dataviz-description"
      label="Description"
      value={definition.description || ''}
      onChange={e => onChange({ description: e.target.value })}
      rows={3}
    />
  </div>
);

export { BasicTab };
