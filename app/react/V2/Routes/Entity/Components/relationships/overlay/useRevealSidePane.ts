import { useState } from 'react';

const useRevealSidePane = (active: boolean, showSidePane: () => void) => {
  const [seen, setSeen] = useState(false);
  if (active && !seen) {
    setSeen(true);
    showSidePane();
  } else if (!active && seen) {
    setSeen(false);
  }
};

export { useRevealSidePane };
