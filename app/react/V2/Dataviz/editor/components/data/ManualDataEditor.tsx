import React, { useState } from 'react';
import { CodeEditor } from '#V2/Components/CodeEditor/index.js';
import { Button } from '#V2/Components/UI/Button.js';
import type { ChartType } from '#shared/types/datavizSchema.js';
import type { DatavizManualDataPayload } from '#shared/types/datavizSchema.js';
import { parseManualDataPayload, stringifyManualDataPayload } from '#shared/dataviz/manualData.js';
import { getManualExampleForChartType } from '#shared/dataviz/manualDataExamples.js';
import { LoadManualExampleModal } from './LoadManualExampleModal.js';

type ManualDataEditorProps = {
  manualData?: DatavizManualDataPayload;
  onChange: (manualData: DatavizManualDataPayload) => void;
  onLoadExample?: (chartType: ChartType, manualData: DatavizManualDataPayload) => void;
};

const ManualDataEditor = ({ manualData, onChange, onLoadExample }: ManualDataEditorProps) => {
  const [parseError, setParseError] = useState<string | null>(null);
  const [editorValue, setEditorValue] = useState(() => stringifyManualDataPayload(manualData));
  const [editorKey, setEditorKey] = useState(0);
  const [showExampleModal, setShowExampleModal] = useState(false);

  const handleEditorChange = (value: string) => {
    setEditorValue(value);
    try {
      const parsed = parseManualDataPayload(JSON.parse(value));
      setParseError(null);
      onChange(parsed);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid JSON';
      setParseError(message);
    }
  };

  const applyExample = (chartType: ChartType) => {
    const example = getManualExampleForChartType(chartType);
    const exampleText = stringifyManualDataPayload(example);
    setEditorValue(exampleText);
    setEditorKey(current => current + 1);
    setParseError(null);
    onChange(example);
    onLoadExample?.(chartType, example);
  };

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-ink">Manual data</h3>
          <p className="mt-1 text-xs text-ink-secondary">
            Provide chart-ready data as JSON. Each series needs <code className="text-ink">id</code>
            , <code className="text-ink">label</code>, and a{' '}
            <code className="text-ink">points</code> array with{' '}
            <code className="text-ink">label</code> and <code className="text-ink">value</code> per
            row. Optional <code className="text-ink">key</code> on points helps stable colors.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="small"
          onClick={() => setShowExampleModal(true)}
        >
          Load example
        </Button>
      </div>
      <div className="h-80 overflow-hidden rounded-lg border border-border">
        <CodeEditor
          key={editorKey}
          language="json"
          intialValue={editorValue}
          onChange={handleEditorChange}
        />
      </div>
      {parseError && <p className="text-xs text-red-600">{parseError}</p>}
      <p className="text-xs text-ink-muted">Preview updates when the JSON is valid.</p>
      {showExampleModal && (
        <LoadManualExampleModal
          onSelect={applyExample}
          onClose={() => setShowExampleModal(false)}
        />
      )}
    </section>
  );
};

export { ManualDataEditor };
