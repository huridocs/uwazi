import { useEffect, useId, useLayoutEffect, type Dispatch, type SetStateAction } from 'react';
import { useRelationshipsPanelUi } from '#V2/Routes/Entity/Components/context/index.js';
import { useRelationshipCollapseRegistry } from '../panel/relationshipCollapseState.js';

const useExpandCollapseSignals = (
  setExpanded: Dispatch<SetStateAction<boolean>>,
  markerIds: string[],
  expanded: boolean
) => {
  const registry = useRelationshipCollapseRegistry();
  const id = useId();
  const {
    expandAllSignal: expandSignal,
    collapseAllSignal: collapseSignal,
    expandForRefId,
    setExpandForRefId,
  } = useRelationshipsPanelUi();

  useLayoutEffect(() => {
    registry?.report(id, expanded);
    if (!registry) return undefined;
    return () => registry.remove(id);
  }, [expanded, id, registry]);

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
