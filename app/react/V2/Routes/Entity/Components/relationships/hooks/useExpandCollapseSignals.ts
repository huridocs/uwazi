import { useEffect, type Dispatch, type SetStateAction } from 'react';
import { useRelationshipsPanelUi } from '#V2/Routes/Entity/Components/context/index.js';
import { useEnsureResolved } from '#V2/Routes/Entity/Components/context/RelationshipsQueryProvider.js';

const useExpandCollapseSignals = (
  setExpanded: Dispatch<SetStateAction<boolean>>,
  markerIds: string[] = []
) => {
  const {
    expandAllSignal: expandSignal,
    collapseAllSignal: collapseSignal,
    expandForRefId,
    setExpandForRefId,
  } = useRelationshipsPanelUi();
  const ensureResolved = useEnsureResolved();

  useEffect(() => {
    if (expandSignal > 0) {
      ensureResolved().catch(() => undefined);
      setExpanded(true);
    }
  }, [ensureResolved, expandSignal, setExpanded]);

  useEffect(() => {
    if (collapseSignal > 0) setExpanded(false);
  }, [collapseSignal, setExpanded]);

  useEffect(() => {
    if (!expandForRefId || markerIds.length === 0) return;
    if (markerIds.includes(expandForRefId)) {
      ensureResolved().catch(() => undefined);
      setExpanded(true);
      setExpandForRefId(null);
    }
  }, [ensureResolved, expandForRefId, markerIds, setExpanded, setExpandForRefId]);
};

export { useExpandCollapseSignals };
