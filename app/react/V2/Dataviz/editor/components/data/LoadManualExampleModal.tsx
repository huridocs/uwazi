import React, { useMemo, useState } from 'react';
import { Modal } from '#V2/Components/UI/Modal.js';
import { Button } from '#V2/Components/UI/Button.js';
import { InputField } from '#V2/Components/Forms/InputField.js';
import {
  CHART_TYPE_LABELS,
  EDITOR_CHART_TYPES,
  type ChartType,
} from '#V2/Dataviz/types/chartTypes.js';

type LoadManualExampleModalProps = {
  onSelect: (chartType: ChartType) => void;
  onClose: () => void;
};

const LoadManualExampleModal = ({ onSelect, onClose }: LoadManualExampleModalProps) => {
  const [search, setSearch] = useState('');

  const available = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return EDITOR_CHART_TYPES;
    }
    return EDITOR_CHART_TYPES.filter(type => CHART_TYPE_LABELS[type].toLowerCase().includes(query));
  }, [search]);

  return (
    <Modal size="md">
      <Modal.Header>
        <span className="text-lg font-semibold">Load example</span>
        <Modal.CloseButton onClick={onClose} />
      </Modal.Header>
      <Modal.Body>
        <InputField
          id="chart-type-search"
          label="Search chart types"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Type to filter…"
        />
        <ul className="mt-4 max-h-60 space-y-1 overflow-y-auto">
          {available.length === 0 && (
            <li className="text-sm text-ink-secondary">No chart types match your search.</li>
          )}
          {available.map(chartType => (
            <li key={chartType}>
              <button
                type="button"
                className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-vellum"
                onClick={() => {
                  onSelect(chartType);
                  onClose();
                }}
              >
                {CHART_TYPE_LABELS[chartType]}
              </button>
            </li>
          ))}
        </ul>
      </Modal.Body>
      <Modal.Footer>
        <Button type="button" variant="secondary" size="small" onClick={onClose}>
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export { LoadManualExampleModal };
