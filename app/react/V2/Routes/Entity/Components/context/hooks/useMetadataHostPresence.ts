import { useCallback, useRef, useState } from 'react';
import type { MetadataEditingHost } from '../metadataEditingSession.js';

type MetadataActiveByHost = Record<MetadataEditingHost, boolean>;

const useMetadataHostPresence = () => {
  const [lastMetadataAnchor, setLastMetadataAnchor] = useState<MetadataEditingHost | null>(null);
  const [metadataActiveByHost, setMetadataActiveByHost] = useState<MetadataActiveByHost>({
    main: false,
    side: false,
  });
  const metadataActiveByHostRef = useRef(metadataActiveByHost);
  metadataActiveByHostRef.current = metadataActiveByHost;

  const registerMetadataActive = useCallback((host: MetadataEditingHost, active: boolean) => {
    const prev = metadataActiveByHostRef.current;
    if (prev[host] === active) return;
    const next = { ...prev, [host]: active };
    metadataActiveByHostRef.current = next;
    setMetadataActiveByHost(next);
    if (active) setLastMetadataAnchor(host);
  }, []);

  return {
    lastMetadataAnchor,
    setLastMetadataAnchor,
    metadataActiveByHost,
    registerMetadataActive,
  };
};

export { useMetadataHostPresence };
