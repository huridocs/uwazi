import { useTabGroup } from '#V2/Components/UI/index.js';
import { resolveActiveTabId } from '../../Components/context/metadataEditingSession.js';
import { isValidMainTab, type MainTabId } from '../tabIds.js';

const useResolvedEntityMainTab = (
  urlActiveTabId: MainTabId,
  groupId = 'entity-main'
): MainTabId => {
  const { activeTabId: atomActiveTabId } = useTabGroup(groupId);
  const resolvedTabId = resolveActiveTabId(atomActiveTabId, urlActiveTabId);
  return isValidMainTab(resolvedTabId) ? resolvedTabId : urlActiveTabId;
};

export { useResolvedEntityMainTab };
