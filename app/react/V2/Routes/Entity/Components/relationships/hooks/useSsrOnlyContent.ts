import { useEffect, useState } from 'react';
import { isClient } from '#app/utils/index.js';

const useSsrOnlyContent = () => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  return !isClient || !ready;
};

export { useSsrOnlyContent };
