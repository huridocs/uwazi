import React, { useState } from 'react';
import { Translate } from '#app/I18N/index.js';
import { Button } from '#V2/Components/UI/Button.js';
import type { DatavizSource } from '#V2/Dataviz/types/definition.js';
import { DataSourceRow } from './DataSourceRow.js';
import { AddDataSourceModal } from './AddDataSourceModal.js';

type DataSourcesListProps = {
  sources: DatavizSource[];
  onChange: (sources: DatavizSource[]) => void;
};

const DataSourcesList = ({ sources, onChange }: DataSourcesListProps) => {
  const [showModal, setShowModal] = useState(false);

  const updateSource = (index: number, source: DatavizSource) => {
    const next = [...sources];
    next[index] = source;
    onChange(next);
  };

  const removeSource = (index: number) => {
    onChange(sources.filter((_, i) => i !== index));
  };

  const addSource = (source: DatavizSource) => {
    onChange([...sources, source]);
  };

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-ink">
        <Translate>Data sources</Translate>
      </h3>
      {sources.map((source, index) => (
        <DataSourceRow
          key={`source-row-${index}`}
          source={source}
          index={index}
          showAlias={sources.length > 1}
          canRemove={sources.length > 1}
          onChange={updated => updateSource(index, updated)}
          onRemove={() => removeSource(index)}
        />
      ))}
      <Button type="button" variant="secondary" size="small" onClick={() => setShowModal(true)}>
        <Translate>+ Add data source</Translate>
      </Button>
      {showModal && <AddDataSourceModal onAdd={addSource} onClose={() => setShowModal(false)} />}
    </section>
  );
};

export { DataSourcesList };
