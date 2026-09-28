const createPointerFrame = () => {
  let frameId = 0;
  let pending: (() => void) | undefined;

  const cancel = () => {
    if (frameId) {
      cancelAnimationFrame(frameId);
      frameId = 0;
    }
    pending = undefined;
  };

  const schedule = (work: () => void) => {
    pending = work;
    if (frameId) {
      return;
    }
    frameId = requestAnimationFrame(() => {
      frameId = 0;
      const run = pending;
      pending = undefined;
      run?.();
    });
  };

  return { schedule, cancel };
};

export { createPointerFrame };
