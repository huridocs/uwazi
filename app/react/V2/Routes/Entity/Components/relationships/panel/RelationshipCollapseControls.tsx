import React, { useCallback } from 'react';
import { t, Translate } from '#app/I18N/index.js';
import { ChevronsDownUpIcon, ChevronsUpDownIcon } from '#V2/Components/CustomIcons/index.js';
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

const iconClass = 'inline-block h-3 w-3 @min-[672px]:hidden';
const labelClass = '@max-[671px]:hidden';

const RelationshipCollapseControls = () => {
  const { groupingEnabled, collapseAll, expandAll } = useRelationshipCollapseActions();
  const collapseLabel = t('System', 'Collapse all', null, false);
  const expandLabel = t('System', 'Expand all', null, false);

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        aria-label={collapseLabel}
        disabled={!groupingEnabled}
        onClick={collapseAll}
        className={collapseControlClass(groupingEnabled)}
      >
        <ChevronsDownUpIcon className={iconClass} aria-hidden />
        <span className={labelClass}>
          <Translate>Collapse all</Translate>
        </span>
      </button>
      <button
        type="button"
        aria-label={expandLabel}
        disabled={!groupingEnabled}
        onClick={expandAll}
        className={collapseControlClass(groupingEnabled)}
      >
        <ChevronsUpDownIcon className={iconClass} aria-hidden />
        <span className={labelClass}>
          <Translate>Expand all</Translate>
        </span>
      </button>
    </div>
  );
};

export { RelationshipCollapseControls };
