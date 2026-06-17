import { useEffect, type Dispatch, type SetStateAction } from 'react';
import { useRelationshipsPanelFilters } from '../../context/EntityScopedProvider.js';

const useExpandCollapseSignals = (
  setExpanded: Dispatch<SetStateAction<boolean>>,
  markerIds: string[] = []
) => {
  const {
    expandAllSignal: expandSignal,
    collapseAllSignal: collapseSignal,
    expandForRefId,
    setExpandForRefId,
  } = useRelationshipsPanelFilters();

  useEffect(() => {
    if (expandSignal > 0) setExpanded(true);
  }, [expandSignal, setExpanded]);

  useEffect(() => {
    if (collapseSignal > 0) setExpanded(false);
  }, [collapseSignal, setExpanded]);

  useEffect(() => {
    if (!expandForRefId || markerIds.length === 0) return;
    if (markerIds.includes(expandForRefId)) {
      setExpanded(true);
      setExpandForRefId(null);
    }
  }, [expandForRefId, markerIds, setExpanded, setExpandForRefId]);
};

export { useExpandCollapseSignals };
