import { useEffect, useState } from 'react';

const useAnimateToPosition = (position: number) => {
  const [animatedPosition, setAnimatedPosition] = useState(0);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setAnimatedPosition(position);
    });

    return () => cancelAnimationFrame(frame);
  }, [position]);

  return animatedPosition;
};

export { useAnimateToPosition };
