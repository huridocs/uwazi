import type { MetadataEditingActions } from '../Components/context/metadataEditingTypes.js';

type GuardDirtyTabChangeArgs = {
  currentTab?: string;
  nextTab: string;
  requestDiscard: MetadataEditingActions['requestDiscard'];
  apply: (tabId: string) => void;
  revert: (tabId: string) => void;
};

const guardDirtyTabChange = ({
  currentTab,
  nextTab,
  requestDiscard,
  apply,
  revert,
}: GuardDirtyTabChangeArgs) => {
  if (nextTab === currentTab) {
    apply(nextTab);
    return;
  }
  requestDiscard(
    'tab',
    () => apply(nextTab),
    () => {
      if (currentTab) revert(currentTab);
    }
  );
};

export { guardDirtyTabChange };
export type { GuardDirtyTabChangeArgs };
