import React, { useCallback } from 'react';
import { Translate } from '#app/I18N/index.js';
import {
  useEnsureResolved,
  useRelationshipsPanelLayout,
  useRelationshipsPanelUi,
} from '#V2/Routes/Entity/Components/context/index.js';

const useRelationshipCollapseActions = () => {
  const { groupBy } = useRelationshipsPanelLayout();
  const { setExpandAllSignal, setCollapseAllSignal } = useRelationshipsPanelUi();
  const ensureResolved = useEnsureResolved();
  const groupingEnabled = groupBy !== 'none';

  const collapseAll = useCallback(() => {
    setCollapseAllSignal(signal => signal + 1);
  }, [setCollapseAllSignal]);

  const expandAll = useCallback(() => {
    setExpandAllSignal(signal => signal + 1);
    ensureResolved().catch(() => undefined);
  }, [ensureResolved, setExpandAllSignal]);

  return { groupingEnabled, collapseAll, expandAll };
};

const collapseControlClass = (enabled: boolean) =>
  `px-1 text-micro font-medium ${
    enabled
      ? 'cursor-pointer text-ink-secondary hover:text-ink'
      : 'cursor-not-allowed text-ink-muted'
  }`;

const RelationshipCollapseControls = () => {
  const { groupingEnabled, collapseAll, expandAll } = useRelationshipCollapseActions();

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        disabled={!groupingEnabled}
        onClick={collapseAll}
        className={collapseControlClass(groupingEnabled)}
      >
        <Translate>Collapse all</Translate>
      </button>
      <button
        type="button"
        disabled={!groupingEnabled}
        onClick={expandAll}
        className={collapseControlClass(groupingEnabled)}
      >
        <Translate>Expand all</Translate>
      </button>
    </div>
  );
};

export { RelationshipCollapseControls };
