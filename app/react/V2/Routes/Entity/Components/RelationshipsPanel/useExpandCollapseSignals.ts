import { useEffect, type Dispatch, type SetStateAction } from 'react';
import { useAtom } from 'jotai';
import {
  relationshipsPanelCollapseAllSignalAtom,
  relationshipsPanelExpandAllSignalAtom,
  relationshipsPanelExpandForRefIdAtom,
} from './relationshipsPanelFiltersAtom.js';

const useExpandCollapseSignals = (
  setExpanded: Dispatch<SetStateAction<boolean>>,
  markerIds: string[] = []
) => {
  const [expandSignal] = useAtom(relationshipsPanelExpandAllSignalAtom);
  const [collapseSignal] = useAtom(relationshipsPanelCollapseAllSignalAtom);
  const [expandForRefId, setExpandForRefId] = useAtom(relationshipsPanelExpandForRefIdAtom);

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
