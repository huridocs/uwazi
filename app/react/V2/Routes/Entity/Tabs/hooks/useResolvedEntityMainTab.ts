import { useTabGroup } from '#V2/Components/UI/index.js';
import { resolveActiveTabId } from '../../Components/context/metadataEditingSession.js';
import { isValidMainTab, type MainTabId } from '../tabIds.js';

const useResolvedEntityMainTab = (urlActiveTabId: MainTabId): MainTabId => {
  const { activeTabId: atomActiveTabId } = useTabGroup('entity-main');
  const resolvedTabId = resolveActiveTabId(atomActiveTabId, urlActiveTabId);
  return isValidMainTab(resolvedTabId) ? resolvedTabId : urlActiveTabId;
};

export { useResolvedEntityMainTab };
