import { useCallback, useEffect, useState } from 'react';

const useLibraryMobilePane = (selectedId: string | undefined, creating: boolean) => {
  const [requestedPane, setRequestedPane] = useState<{ index: number; id: number }>();
  const requestPane = useCallback((index: number) => {
    setRequestedPane(current => ({ index, id: (current?.id ?? 0) + 1 }));
  }, []);
  useEffect(() => {
    if (selectedId || creating) requestPane(1);
  }, [creating, requestPane, selectedId]);
  return { requestedPane, requestPane };
};

export { useLibraryMobilePane };
