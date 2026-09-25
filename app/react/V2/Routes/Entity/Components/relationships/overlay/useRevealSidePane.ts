import { useEffect } from 'react';
import { useEntityTabNavigation } from '#V2/Routes/Entity/Tabs/EntityTabsContext.js';

const useRevealSidePane = (active: boolean) => {
  const { showSidePane } = useEntityTabNavigation();
  useEffect(() => {
    if (active) showSidePane();
  }, [active, showSidePane]);
};

export { useRevealSidePane };
