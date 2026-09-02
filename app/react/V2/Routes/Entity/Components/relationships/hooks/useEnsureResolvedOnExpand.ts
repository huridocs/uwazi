import { useEffect } from 'react';
import { useEnsureResolved } from '#V2/Routes/Entity/Components/context/index.js';

const useEnsureResolvedOnExpand = (expanded: boolean) => {
  const ensureResolved = useEnsureResolved();

  useEffect(() => {
    if (!expanded) return;
    ensureResolved().catch(() => undefined);
  }, [ensureResolved, expanded]);
};

export { useEnsureResolvedOnExpand };
