import React, { useCallback, type ReactNode } from 'react';
import { t, Translate } from '#app/I18N/index.js';
import { ChevronsDownUpIcon, ChevronsUpDownIcon } from '#V2/Components/CustomIcons/index.js';
import { PortalTooltip } from '#V2/Components/UI/index.js';
import {
  useEnsureResolved,
  useRelationshipsPanelLayout,
  useRelationshipsPanelUi,
} from '#V2/Routes/Entity/Components/context/index.js';
import { useRelationshipCollapseSummary } from './relationshipCollapseState.js';

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

const collapseControl = ({
  label,
  enabled,
  onClick,
  icon,
  text,
}: {
  label: string;
  enabled: boolean;
  onClick: () => void;
  icon: ReactNode;
  text: ReactNode;
}) => (
  <PortalTooltip content={label} placement="top">
    <span className="inline-flex">
      <button
        type="button"
        aria-label={label}
        disabled={!enabled}
        onClick={onClick}
        className={collapseControlClass(enabled)}
      >
        {icon}
        <span className={labelClass}>{text}</span>
      </button>
    </span>
  </PortalTooltip>
);

const RelationshipCollapseControls = () => {
  const { groupingEnabled, collapseAll, expandAll } = useRelationshipCollapseActions();
  const { hasSections, allCollapsed, allExpanded } = useRelationshipCollapseSummary();
  const collapseEnabled = groupingEnabled && hasSections && !allCollapsed;
  const expandEnabled = groupingEnabled && !allExpanded;
  const collapseLabel = t('System', 'Collapse all', null, false);
  const expandLabel = t('System', 'Expand all', null, false);

  return (
    <div className="flex items-center gap-1">
      {collapseControl({
        label: collapseLabel,
        enabled: collapseEnabled,
        onClick: collapseAll,
        icon: <ChevronsDownUpIcon className={iconClass} aria-hidden />,
        text: <Translate>Collapse all</Translate>,
      })}
      {collapseControl({
        label: expandLabel,
        enabled: expandEnabled,
        onClick: expandAll,
        icon: <ChevronsUpDownIcon className={iconClass} aria-hidden />,
        text: <Translate>Expand all</Translate>,
      })}
    </div>
  );
};

export { RelationshipCollapseControls };
