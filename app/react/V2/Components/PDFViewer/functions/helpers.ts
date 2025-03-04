const triggerScroll = (ref: React.RefObject<HTMLDivElement>, frameId: number): number => {
  let attempts = 0;
  let id = frameId;

  const attemptScroll = () => {
    if (attempts > 9) {
      return;
    }

    if (ref.current && ref.current.clientHeight > 0) {
      ref.current.scrollIntoView({ behavior: 'instant' });
      return;
    }

    attempts += 1;
    id = requestAnimationFrame(attemptScroll);
  };

  attemptScroll();
  return id;
};

export { triggerScroll };
